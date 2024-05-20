import { BearerSecurity, Client, createClientAsync } from 'soap';
import { API_VERSION, SERVICE_MAP } from '../common/constants';
import { GoogleSoapServiceOptions, ImportClass, ProxyConfig } from '../common/types';
import { promiseFromCallback } from '../common/utils';
import { ProxyService } from '../common/utils/proxy.service';

export class GoogleSoapService<T extends keyof typeof SERVICE_MAP> {
  private networkCode: number;
  private applicationName: string;
  private service: T;
  private token: string;
  private proxy?: ProxyConfig;
  private _client: Client;
  private apiVersion: string;

  constructor(service: T, options: GoogleSoapServiceOptions, apiVersion: string = API_VERSION) {
    this.service = service;
    this.applicationName = options.applicationName;
    this.networkCode = options.networkCode;
    this.token = options.token;
    this.proxy = options.proxy;
    this.apiVersion = apiVersion;
  }

  public async createClient(): Promise<ImportClass<typeof SERVICE_MAP, T>> {
    const serviceUrl = `https://ads.google.com/apis/ads/publisher/${this.apiVersion}/${this.service}?wsdl`;

    const client = await (async () => {
      if (this.proxy) {
        return await createClientAsync(serviceUrl, {
          request: ProxyService.getProxyInstance(this.proxy),
        });
      }
      return await createClientAsync(serviceUrl);
    })();

    client.addSoapHeader(this.getSoapHeaders());
    client.setToken = function setToken(token: string) {
      client.setSecurity(new BearerSecurity(token));
    };

    if (this.token) client.setToken(this.token);

    this._client = new Proxy(client, {
      get: function get(target, propertyKey) {
        const method = propertyKey.toString();

        if (target.hasOwnProperty(method) && !['setToken'].includes(method)) {
          return async function run(dto: any = {}) {
            const res = await promiseFromCallback((cb) => client[method](dto, cb));

            return res?.rval || null;
          };
        } else {
          return target[method];
        }
      },
    });

    const services = SERVICE_MAP as any;
    console.log(this._client.lastRequest);
    return new services[this.service](this._client);
  }

  private getSoapHeaders(): any {
    return {
      RequestHeader: {
        attributes: {
          'soapenv:actor': 'http://schemas.xmlsoap.org/soap/actor/next',
          'soapenv:mustUnderstand': 0,
          'xsi:type': 'ns1:SoapRequestHeader',
          'xmlns:ns1': 'https://www.google.com/apis/ads/publisher/' + this.apiVersion,
          'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
          'xmlns:soapenv': 'http://schemas.xmlsoap.org/soap/envelope/',
        },
        'ns1:networkCode': this.networkCode,
        'ns1:applicationName': this.applicationName,
      },
    };
  }
}
