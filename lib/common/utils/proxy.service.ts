import axios from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { SocksProxyAgent } from 'socks-proxy-agent';
import { ProxyConfig } from '../types';

export class ProxyService {
  public static getProxyInstance({ host, port, protocol, password, username }: ProxyConfig) {
    const proxyString = username && password ? `${username}:${password}@${host}:${port}` : `${host}:${port}`;
    if (protocol === 'http') {
      return axios.create({
        httpsAgent: new HttpsProxyAgent('http://' + proxyString),
      });
    }
    return axios.create({
      httpsAgent: new SocksProxyAgent('socks5://' + proxyString),
    });
  }
}
