import { ActionTypes, RuntimeData } from '../types';
import { SessionLifeTime } from '../utills/constants';

export default class RuntimeStore {
  private static session: Record<number, RuntimeData> = {};

  public static shouldRefresh(id: number): boolean {
    const now = new Date().getTime();
    const lastLogin = !RuntimeStore.session[id] ? 0 : RuntimeStore.session[id].lastLogin;
    return now > lastLogin + SessionLifeTime;
  }

  public static updateLastLogin(id: number): void {
    RuntimeStore.session[id].lastLogin = new Date().getTime();
  }

  public static getStore(id: number): RuntimeData {
    return RuntimeStore.session[id];
  }

  public static setStore(id: number, password: string, msgId: number): void {
    RuntimeStore.session[id] = { password, msgId, lastLogin: new Date().getTime(), temp: {} };
  }

  public static getAction(id: number): ActionTypes {
    return RuntimeStore.session[id]?.currentAction;
  }

  public static setAction(id: number, action: ActionTypes): void {
    if (!RuntimeStore.session[id]) {
      RuntimeStore.session[id] = { currentAction: action, temp: {} };
    } else {
      RuntimeStore.session[id].currentAction = action
    }
  }

  public static removeAction(id: number): void {
    RuntimeStore.session[id].currentAction = null;
  }

  public static setTempData(id: number, key: string, val: any): void {
    RuntimeStore.session[id].temp[key] = val;
  }

  public static getAndDeleteTempData(id: number, key: string): any {
    const data = RuntimeStore.session[id].temp[key];
    RuntimeStore.session[id].temp[key] = undefined;
    return data;
  }

  public static getTempData(id: number, key: string): any {
    const data = RuntimeStore.session[id].temp[key];
    return data;
  }

  public static deleteTempData(id: number, key: string): void {
    RuntimeStore.session[id].temp[key] = undefined;
  }
}
