import { useEffect } from 'react';
import { DawnGlow } from './components/DawnGlow';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { LiveChat } from './components/LiveChat';
import { NewsletterPopup } from './components/NewsletterPopup';
import { PageScene3D } from './components/PageScene3D';
import { trackVisit } from './lib/api';
import { useRoute, useTheme } from './lib/hooks';
import Home from './pages/Home';
import { NotFound, ServiceDetail, Services } from './pages/Services';
import { Portfolio, ProjectDetail } from './pages/Portfolio';
import { Blog, BlogPostDetail } from './pages/Blog';
import { ProductsShowcase } from './pages/ProductsShowcase';
import { About, Contact, Partners, Privacy, ProductDetail } from './pages/Others';

export default function App() {
  const { page, id } = useRoute();
  const { theme } = useTheme();

  useEffect(() => {
    trackVisit(page, id);
  }, [page, id]);

  let view;
  switch (page) {
    case 'inicio': view = <Home />; break;
    case 'servicos': view = id ? <ServiceDetail id={id} /> : <Services />; break;
    case 'portfolio': view = id ? <ProjectDetail id={id} /> : <Portfolio />; break;
    case 'produtos': view = id ? <ProductDetail id={id} /> : <ProductsShowcase />; break;
    case 'sobre': view = <About />; break;
    case 'parceiros': view = <Partners />; break;
    case 'blog':
    case 'noticias': view = id ? <BlogPostDetail id={id} /> : <Blog />; break;
    case 'contacto': view = <Contact id={id} />; break;
    case 'privacidade': view = <Privacy />; break;
    default: view = <NotFound />;
  }
  return (
    <>
      <DawnGlow theme={theme} />
      {page !== 'inicio' && <PageScene3D page={page} />}
      <a href="#conteudo" onClick={(e) => { e.preventDefault(); document.getElementById('conteudo')?.focus(); }} className="sr-only z-[100] rounded-full bg-white px-5 py-3 font-semibold text-black focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
        Saltar para o conteúdo
      </a>
      <Header page={page} />
      <main id="conteudo" tabIndex={-1} key={`${page}/${id || ''}`} className="page-in relative z-10 outline-none">{view}</main>
      <Footer />
      <LiveChat />
      <NewsletterPopup />
    </>
  );
}
