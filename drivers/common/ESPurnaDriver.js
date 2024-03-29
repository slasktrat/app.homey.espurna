'use strict';

const 	Homey 				= require('homey');
const 	http				= require('http.min');

class ESPurnaDriver extends Homey.Driver {
	
	onInit() {
		this.log('Espurna driver driver has been initialized');
	}

    onPair( session ) {
        session.setHandler('configure', async (device) => {
            console.log( device );

            return http( `http://${device.settings.ip_address}/apis?apikey=${device.settings.apikey}`).then(function (result) {
                if(result.response.statusCode === 200) {
                    console.log('Code: ' + result.response.statusCode);
                    console.log('Response: ' + result.data);

                    const capabilities = [];
                    if(/^relay\/0 /m.test(result.data))
                        capabilities.push("onoff");
                    if(/^voltage /m.test(result.data))
                        capabilities.push("measure_voltage");
                    if(/^current /m.test(result.data))
                        capabilities.push("measure_current");
                    if(/^power /m.test(result.data))
                        capabilities.push("measure_power");
                    if(/^energy /m.test(result.data))
                        capabilities.push("meter_power");

                    device.capabilities = capabilities;
                    return device
                }
                else if(result.response.statusCode === 403)
                    throw new Error('Wrong API key?');
                else
                    throw new Error("Could not connect. Verify IP and API key");
            }).catch(err =>
            {
                console.error(err);
                throw err;
            });
        });
    }
}

module.exports = ESPurnaDriver;