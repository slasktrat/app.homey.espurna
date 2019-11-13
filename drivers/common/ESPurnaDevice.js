'use strict';

const   Homey               = require('homey');
const 	http				= require('http.min');

class ESPurnaDevice extends Homey.Device {
	
	onInit() {
        this._settings = this.getSettings();
        this._pollIntervalSeconds = 10;
        this._lastContact = 0;
        this._isSyncing = false;

        this.log(`ESPurna device ${this.getName()} has been initialized`);

        if (this.hasCapability("onoff")) {
            this.registerCapabilityListener('onoff', (value, opts) => {
                return http.put(`http://${this._settings.ip_address}/api/relay/0`, `apikey=${this._settings.apikey}&value=${!!value ? 1 : 0}`).catch((e) => this.error("Error setting onoff", e));
            });
        }

        this._interval = setInterval(this.getValues.bind(this), this._pollIntervalSeconds * 1000);
        this.getValues();
	}

	onDeleted() {
        this.log(`ESPurna device ${this.getName()} has been deleted`);
        clearInterval(this._interval);
    }

	async syncCapabilityFromDevice(capability, apiUrl) {
	    try {
            this._settings = this.getSettings();
            if (this.hasCapability(capability)) {
                const result = await http.json(`http://${this._settings.ip_address}${apiUrl}?apikey=${this._settings.apikey}`);
                this.setCapabilityValue(capability, capability === "onoff" ? !!result : result).catch((e) => this.error(capability, e));
                this._lastContact = new Date().getTime();
                this.setAvailable();
            }
        }
        catch (e) {
            this.error(`Error syncing capability ${capability}`, e);
            if(new Date().getTime() - this._lastContact > (120 * 1000))
                this.setUnavailable("Could not reach device");
        }
    }

    async getValues() {
        if(this._isSyncing)
            return;

	    try {
            this._isSyncing = true;
            this.log('Syncing values');
            await this.syncCapabilityFromDevice("onoff", "/api/relay/0");
            await this.syncCapabilityFromDevice("measure_current", "/api/current");
            await this.syncCapabilityFromDevice("measure_voltage", "/api/voltage");
            await this.syncCapabilityFromDevice("measure_power", "/api/power");
            await this.syncCapabilityFromDevice("meter_power", "/api/energy");
        }
        finally {
            this._isSyncing = false;
        }
    }
}

module.exports = ESPurnaDevice;