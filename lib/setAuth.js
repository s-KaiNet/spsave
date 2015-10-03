var consts = require("constants");
module.exports = function setAuth(options, auth, requestOptions, onPrem) {
	if (onPrem) {
		requestOptions.username = auth.username;
		requestOptions.password = auth.password;
		requestOptions.workstation = auth.workstation;
		requestOptions.domain = auth.domain;
	} else {
		requestOptions.cookies = [
            "FedAuth=" + auth.FedAuth,
            "rtFa=" + auth.rtFa
		];
		requestOptions.secureOptions = consts.SSL_OP_NO_TLSv1_2
	}
}