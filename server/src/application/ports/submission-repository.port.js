export class ISubmissionRepository {
  async save(_submissionEntity) {
    throw new Error('Method not implemented: save');
  }

  async findById(_id) {
    throw new Error('Method not implemented: findById');
  }

  async findRecent(_limit) {
    throw new Error('Method not implemented: findRecent');
  }

  async updateStatus(_id, _status, _metadata) {
    throw new Error('Method not implemented: updateStatus');
  }
}
