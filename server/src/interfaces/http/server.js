export function startServer({ app, port, host, logger, queueService }) {
  const server = app.listen(port, host, () => {
    logger.info(`[Server] Microserviço em execução em http://${host}:${port}`);
  });

  let shuttingDown = false;

  const gracefulShutdown = async (signal) => {
    if (shuttingDown) return;
    shuttingDown = true;

    logger.warn(`[Server] Sinal ${signal} recebido. A iniciar encerramento controlado...`);

    // 1. Fechar recepção de novas requisições HTTP
    server.close(async () => {
      logger.info('[Server] Servidor HTTP fechado. A drenar fila de tarefas pendentes...');

      try {
        // 2. Drenar tarefas ativas na fila
        if (queueService) {
          await queueService.drain();
          logger.info('[Server] Fila de tarefas drenada com sucesso.');
        }

        logger.info('[Server] Encerramento concluído com sucesso. A sair.');
        process.exit(0);
      } catch (err) {
        logger.error('[Server] Erro ao drenar fila:', { error: err.message });
        process.exit(1);
      }
    });

    // Timeout forçado de segurança após 10 segundos
    setTimeout(() => {
      logger.error('[Server] Encerramento forçado por timeout de segurança (10s).');
      process.exit(1);
    }, 10000).unref();
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  return server;
}
