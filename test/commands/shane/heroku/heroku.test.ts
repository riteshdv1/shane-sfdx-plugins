/* tslint:disable:no-unused-expression */
import child_process = require('child_process');
import fs = require('fs-extra');
import * as stripcolor from 'strip-color';
import util = require('util');

import testutils = require('../../../helpers/testutils');

const exec = util.promisify(child_process.exec);

const testProjectName = 'mshanemc-custexp-123456789';

describe('shane:heroku:connect', () => {
  jest.setTimeout(testutils.remoteTimeout);

  if (!process.env.LOCALONLY) {
    // create an org
    beforeAll(async () => {
      await fs.remove(testProjectName);
      await exec(`sfdx force:project:create -n ${testProjectName}`);

      await testutils.orgCreate(testProjectName);
      await exec('sfdx force:user:password:generate', { cwd: testProjectName });

      // we can't handle 2FA challenges in a headless browser!
      await exec('sfdx shane:profile:whitelist -n Admin', { cwd: testProjectName });
      await exec('sfdx force:source:push', { cwd: testProjectName });
      // create our test file
      await fs.writeJSON(`${testProjectName}/mapping.json`, testMapping);
      // generate a password because we'll need it for heroku connect authing
    });

    it('sets up a heroku app with deploy', async () => {
      // sfdx shane:heroku:repo:deploy -g mshanemc -r electron-web-app -n `basename "${PWD/mshanemc-/}"` -t autodeployed-demos
      const results = await exec('sfdx shane:heroku:repo:deploy -g mshanemc -r electron-web-app -n `basename "${PWD/mshanemc-/}"` -t autodeployed-demos --json', { cwd: testProjectName });

      // console.log(results);
      expect(results).toBeTruthy();
      expect(results.stdout).toBeTruthy();
      const stdout = JSON.parse(stripcolor(results.stdout));
      expect(stdout.status).toBe(0);
    });

    // it('configures connect with json response', async () => {
    //   // sfdx shane:heroku:connect -a `basename "${PWD/mshanemc-/}"` -f assets/herokuConnect/electron-web.json
    //   const results = await exec('sfdx shane:heroku:connect -a `basename "${PWD/mshanemc-/}"` -f mapping.json -e custom --verbose', { cwd: testProjectName });

    //   // console.log(results);
    //   expect(results).toBeTruthy();
    //   expect(results.stdout).toBeTruthy();
    //   // const stdout = JSON.parse(stripcolor(results.stdout));
    //   // expect(stdout.status).toBe(0);
    // });

    // afterAll(async () => {
    //   await testutils.orgDelete(testProjectName);
    //   await exec('heroku destroy -a `basename "${PWD/mshanemc-/}"` -c `basename "${PWD/mshanemc-/}"`', { cwd: testProjectName });
    //   await fs.remove(testProjectName);
    // });

    const testMapping = {
      mappings: [
        {
          object_name: 'Contact',
          config: {
            access: 'read_only',
            sf_notify_enabled: true,
            sf_polling_seconds: 600,
            sf_max_daily_api_calls: 30000,
            fields: {
              LastName: {},
              AccountId: {},
              Name: {},
              MobilePhone: {},
              Phone: {},
              IsDeleted: {},
              SystemModstamp: {},
              CreatedDate: {},
              Id: {},
              FirstName: {}
            },
            indexes: {
              SystemModstamp: {
                unique: false
              },
              Id: {
                unique: true
              }
            }
          }
        }
      ],
      connection: {
        app_name: 'custexp-1554380996614',
        organization_id: '00D0R000000DHZVUA4',
        exported_at: '2019-04-04T13:25:57.541610+00:00',
        features: {
          poll_db_no_merge: true,
          poll_external_ids: false,
          rest_count_only: false
        },
        api_version: '45.0',
        name: 'custexp-1554380996614',
        logplex_log_enabled: false
      },
      version: 1
    };
  }

});
