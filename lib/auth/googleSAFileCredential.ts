import { GoogleAuth } from 'google-auth-library';
import { JSONClient } from 'google-auth-library/build/src/auth/googleauth';

import { SCOPE } from '../common/constants';
import { SACredential } from './interfaces';

export class GoogleSAFileCredential implements SACredential {
  private _keyFile: string;
  protected auth: GoogleAuth<JSONClient>;

  /**
   *
   * @param keyFile Path to a .json, .pem, or .p12 key file
   */
  constructor(keyFile: string) {
    if (!keyFile) {
      throw new Error("'keyFile' must be set when using service account flow.");
    }

    this._keyFile = keyFile;

    this.build();
  }

  private async build() {
    this.auth = new GoogleAuth({
      keyFile: this._keyFile,
      scopes: SCOPE,
    });
  }

  async getToken() {
    return await this.auth.getAccessToken();
  }
}
