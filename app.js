'use strict';

const 	Homey 				= require('homey');

class EspurnaApp extends Homey.App {
	
	onInit() {
		this.log('Espurna app is running...');
	}

}

module.exports = EspurnaApp;