var consts = require("constants");
module.exports = function setAuth(options, auth, requestOptions, onPrem) {
	if (onPrem) {
		requestOptions.username = auth.username;
		requestOptions.password = auth.password;
		requestOptions.workstation = auth.workstation;
		requestOptions.domain = auth.domain;
		
		//workaround for on premise self signed or not trusted certificates
		if(options.siteUrl.lastIndexOf("https", 0) === 0) {
			process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
		}
	} else {
		requestOptions.cookies = [
            "FedAuth=" + auth.FedAuth,
            "rtFa=" + auth.rtFa
		];
		requestOptions.secureOptions = consts.SSL_OP_NO_TLSv1_2
	}
}