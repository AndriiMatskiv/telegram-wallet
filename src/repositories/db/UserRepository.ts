import { Knex } from 'knex';
import { User } from '../../types';

export default class UserRepository {
  private static client: Knex;

  public static init(client: Knex) {
    UserRepository.client = client;
  }

  public static async getById(id: number): Promise<User> {
    const res = await UserRepository.client('user').select().where('id', id);  
    if (res.length > 0) {
      return res[0];
    } 
  } 

  public static async getByTId(tid: number): Promise<User> {
    const res = await UserRepository.client('user').select().where('tid', tid);
    if (res.length > 0) {
      return res[0];
    }
  }

  public static async create(tid: number, hash: string, msgId: number): Promise<number> {
    return await UserRepository.client<User>('user').insert({ tid, password: hash, storageMessageId: msgId }).returning('id');
  }
}
