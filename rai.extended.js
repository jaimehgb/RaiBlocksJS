/*
* RaiBlocks extended functions in JavaScript
* https://github.com/SergiySW/RaiBlocksJS
*
* Released under the BSD 3-Clause License
*
*/


// Global variables: block_count, count, unchecked, frontier_count, frontiers, peers
var RaiBlocks = RaiBlocks || {};

Rai.prototype.initialize = function() {
	RaiBlocks.available_supply = this.available_supply();
	RaiBlocks.block_count = this.block_count();
	RaiBlocks.count = RaiBlocks.block_count.count;
	RaiBlocks.unchecked = RaiBlocks.block_count.unchecked;
	RaiBlocks.frontier_count = this.frontier_count();
	RaiBlocks.frontiers = this.frontiers();
	RaiBlocks.peers = this.peers();
}


// Extended function, jQuery is required
Rai.prototype.account_history = function(account, count) {
	var rpc_request = this;
	
	if (typeof RaiBlocks.frontiers == 'undefined') this.initialize(); // if not initialized
	var hash = RaiBlocks.frontiers[account];

	if (typeof hash != 'undefined') {
		var account_history = this.history(hash);
		var chain = this.chain(hash);
		
		// Retrieve change blocks
		$.each(chain, function( key, value ){
			if (account_history[key].hash !== value) {
				let block = rpc_request.block(value);
				if (block.type=='change') {
					let insert = {account:block.representative, amount:0, hash:value, type:block.type};
					account_history.splice(key, 0, insert);
				}
			}
		});
	}
	else {
		console.log("Empty account " + account);
	}
	
	return account_history;
}


// Extended function, jQuery is required
Rai.prototype.wallet_accounts_info = function(wallet, count) {
	var rpc_request = this;
	
	if (typeof RaiBlocks.frontiers == 'undefined') this.initialize(); // if not initialized
	
	var accounts_list = rpc_request.account_list(wallet);

	var wallet_accounts_info = []; // Accounts Array + balances
	$.each(accounts_list, function(){
		let account_balance = rai.account_balance(this);
		let balance = account_balance.balance;
		let pending = account_balance.pending;
		let history = rai.account_history(this, count);
		wallet_accounts_info.push({key: this, raw_balance: balance, balance: rai.unit(balance, 'raw', 'rai'), raw_pending: pending, pending: rai.unit(pending, 'raw', 'rai'), history: history});
	});
	
	return wallet_accounts_info;
}


Rai.prototype.rpc_version = function() {
	var rpc_version = this.version().rpc_version;
	return rpc_version;
}


Rai.prototype.store_version = function() {
	var store_version = this.version().store_version;
	return store_version;
}


Rai.prototype.node_vendor = function() {
	var node_vendor = this.version().node_vendor;
	return node_vendor;
}


// String output
Rai.prototype.balance = function(account, unit) {
	if (typeof unit == 'undefined') { unit = 'raw'; }
	var account_balance = this.account_balance(account);
	var balance = this.unit(account_balance.balance, 'raw', unit);
	return balance;
}


// String output
Rai.prototype.account_pending = function(account, unit) {
	if (typeof unit == 'undefined') { unit = 'raw'; }
	var account_balance = this.account_balance(account);
	var pending = this.unit(account_balance.pending, 'raw', unit);
	return pending;
}


// String output
Rai.prototype.count = function() {
	var count = this.block_count().count;
	return count;
}


// String output
Rai.prototype.unchecked = function() {
	var unchecked = this.block_count().unchecked;
	return unchecked;
}


// String output
Rai.prototype.wallet_balance = function(wallet, unit) {
	var rpc_request = this;
	if (typeof unit == 'undefined') { unit = 'raw'; }
	
	var accounts_list = rpc_request.account_list(wallet);
	var balance = 0;
	var pending = 0;
	
	$.each(accounts_list, function(){
		let account_balance = rai.account_balance(this);
		balance = parseInt(account_balance.balance) + balance;
		pending = parseInt(account_balance.pending) + pending;
	});
	
	var wallet_balance = { balance: rai.unit(balance, 'raw', unit), pending: rai.unit(pending, 'raw', unit) };
	return wallet_balance;
}


// Arrays manipulations
uint8_uint4 = function(uint8) {
	var length = uint8.length;
	var uint4 = new Uint8Array(length*2);
	for (let i = 0; i < length; i++) {
		uint4[i*2] = uint8[i] / 16 | 0;
		uint4[i*2+1] = uint8[i] % 16;
	}
	return uint4;
}

uint4_uint8 = function(uint4) {
	var length = uint4.length / 2;
	var uint8 = new Uint8Array(length);
	for (let i = 0; i < length; i++)	uint8[i] = uint4[i*2] * 16 + uint4[i*2+1];
	return uint8;
}

uint4_uint5 = function(uint4) {
	var length = uint4.length / 5 * 4;
	var uint5 = new Uint8Array(length);
	for (let i = 1; i <= length; i++) {
		let n = i - 1;
		let m = i % 4;
		let z = n + ((i - m)/4);
		let right = uint4[z] << m;
		let left;
		if (((length - i) % 4) == 0)	left = uint4[z-1] << 4;
		else	left = uint4[z+1] >> (4 - m);
		uint5[n] = (left + right) % 32;
	}
	return uint5;
}

uint5_uint4 = function(uint5) {
	var length = uint5.length / 4 * 5;
	var uint4 = new Uint8Array(length);
	for (let i = 1; i <= length; i++) {
		let n = i - 1;
		let m = i % 5;
		let z = n - ((i - m)/5);
		let right = uint5[z-1] << (5 - m);
		let left = uint5[z] >> m;
		uint4[n] = (left + right) % 16;
	}
	return uint4;
}

string_uint5 = function(string) {
	var letter_list = letter_list = '13456789abcdefghijkmnopqrstuwxyz'.split('');
	var length = string.length;
	var string_array = string.split('');
	var uint5 = new Uint8Array(length);
	for (let i = 0; i < length; i++)	uint5[i] = letter_list.indexOf(string_array[i]);
	return uint5;
}

uint5_string = function(uint5) {
	var letter_list = letter_list = '13456789abcdefghijkmnopqrstuwxyz'.split('');
	var string = "";
	for (let i = 0; i < uint5.length; i++)	string += letter_list[uint5[i]];
	return string;
}

hex_uint8 = function(hex) {
	var length = (hex.length / 2) | 0;
	var uint8 = new Uint8Array(length);
	for (let i = 0; i < length; i++) uint8[i] = parseInt(hex.substr(i * 2, 2), 16);
	return uint8;
}

uint4_hex = function(uint4) {
	var hex = "";
	for (let i = 0; i < uint4.length; i++)	hex += uint4[i].toString(16).toUpperCase();
	return(hex);
}

uint8_hex = function(uint8) {
	var hex = uint4_hex(uint8_uint4(uint8));
	return(hex);
}

int_uint8 = function(integer, length) {
	var uint8 = new Uint8Array(length);
	for (var index = 0; index < length; index ++ ) {
		var byte = integer & 0xff;
		uint8 [ index ] = byte;
			integer = (integer - byte) / 256 ;
	}
	return uint8;
};

equal_arrays = function(array1, array2) {
	for (let i = 0; i < array1.length; i++) {
		if (array1[i] != array2[i])	return false;
	}
	return true;
}

array_crop = function(array) {
	var length = array.length - 1;
	var cropped_array = new Uint8Array(length);
	for (let i = 0; i < length; i++)	cropped_array[i] = array[i+1];
	return cropped_array;
}

array_extend = function(array) {
	var length = array.length + 1;
	var extended_array = new Uint8Array(length);
	for (let i = 0; i < (length - 1); i++)	extended_array[i+1] = array[i];
	return extended_array;
}
// Arrays manipulations


// String output
Rai.prototype.ext_account_get = function(key) {
	var isValid = /^[0123456789ABCDEF]+$/.test(key);
	if (isValid && (key.length == 64)) {
		var key_array = hex_uint8(key);
		var bytes = uint4_uint5(array_extend(uint8_uint4(key_array)));
		var blake_hash = blake2b(key_array, null, 5).reverse();
		var hash_bytes = uint4_uint5(uint8_uint4(blake_hash));
		var account = "xrb_" + uint5_string(bytes) + uint5_string(hash_bytes);
		return account;
	}
	else {
		this.error('Invalid public key');
		return false;
	}
}


// String output
Rai.prototype.ext_account_key = function(account) {
	if ((account.startsWith('xrb_1') || account.startsWith('xrb_3')) && (account.length == 64)) {
		var account_crop = account.substring(4,64);
		var isValid = /^[13456789abcdefghijkmnopqrstuwxyz]+$/.test(account_crop);
		if (isValid) {
			var key_uint4 = array_crop(uint5_uint4(string_uint5(account_crop.substring(0,52))));
			var hash_uint4 = uint5_uint4(string_uint5(account_crop.substring(52,60)));
			var key_array = uint4_uint8(key_uint4);
			var blake_hash = blake2b(key_array, null, 5).reverse();
			if (equal_arrays(hash_uint4, uint8_uint4(blake_hash))) {
				var key = uint4_hex(key_uint4);
				return key;
			}
			else {
				this.error('Invalid account');
				return false;
			}
		}
		else {
			this.error('Invalid symbols');
			return false;
		}
	}
	else {
		this.error('Invalid account');
		return false;
	}
}


// Boolean output
Rai.prototype.account_validate = function(account) {
	var valid = this.ext_account_key (account);
	if (valid)	return true;
	else	return false;
}


function pow_threshold (Uint8Array) {
	if ((Uint8Array[0] == 255) && (Uint8Array[1] == 255) && (Uint8Array[2] == 255) && (Uint8Array[3] >= 192))	return true;
	else	return false;
}


Rai.prototype.pow_initiate = function(threads, worker_path) {
	if (typeof worker_path == 'undefined') { worker_path = ''; }
	if (isNaN(threads)) { threads = self.navigator.hardwareConcurrency - 1; }
	var workers = [];
	for (let i = 0; i < threads; i++) {
		workers[i] = new Worker(worker_path + 'rai.pow.js');
	}
	return workers;
}


// hash input as Uint8Array
Rai.prototype.pow_start = function(workers, hash) {
	if ((hash instanceof Uint8Array) && (hash.length == 32)) {
		var threads = workers.length;
		for (let i = 0; i < threads; i++) {
			workers[i].postMessage(hash);
		}
	}
	else	this.error('Invalid hash array');
}


Rai.prototype.pow_terminate = function(workers) {
	var threads = workers.length;
	for (let i = 0; i < threads; i++) {
		workers[i].terminate();
	}
}


// hash input as Uint8Array, callback as function
Rai.prototype.pow_callback = function(workers, hash, callback) {
	if ((hash instanceof Uint8Array) && (hash.length == 32) && (typeof callback == 'function')) {
		var pow = this;
		var threads = workers.length;
		for (let i = 0; i < threads; i++) {
			workers[i].onmessage = function(e) {
				result = e.data;
				if (result) {
					pow.pow_terminate (workers);
					callback (result); 
				}
				else workers[i].postMessage(hash);
			}
		}
	}
	else if (typeof callback != 'function')	this.error('Invalid callback function');
	else	this.error('Invalid hash array');
}


// hash_hex input as text, callback as function
Rai.prototype.pow = function(hash_hex, threads, callback, worker_path) {
	var isValid = /^[0123456789ABCDEF]+$/.test(hash_hex);
	if (isValid && (hash_hex.length == 64)) {
		var hash = hex_uint8(hash_hex);
		var workers = this.pow_initiate(threads, worker_path);
		this.pow_start(workers, hash);
		this.pow_callback(workers, hash, callback);
	}
	else	this.error('Invalid hash');
}


// Boolean output
Rai.prototype.pow_validate = function(pow_hex, hash_hex) {
	var isValidHash = /^[0123456789ABCDEF]+$/.test(hash_hex);
	if (isValidHash && (hash_hex.length == 64)) {
		var hash = hex_uint8(hash_hex);
		var isValidPOW = /^[0123456789ABCDEFabcdef]+$/.test(pow_hex);
		if (isValidPOW && (pow_hex.length == 16)) {
			var pow = hex_uint8(pow_hex);
			var context = blake2bInit(8, null);
			blake2bUpdate(context, pow.reverse());
			blake2bUpdate(context, hash);
			var check = blake2bFinal(context).reverse();
			if (pow_threshold(check))	return true;
			else	return false;
		}
		else {
			this.error('Invalid work');
			return false;
		}
	}
	else {
		this.error('Invalid hash');
		return false;
	}
}




// String output
Rai.prototype.seed_key = function(seed_hex, index) {
	var isValidHash = /^[0123456789ABCDEF]+$/.test(seed_hex);
	if (isValidHash && (seed_hex.length == 64)) {
		var seed = hex_uint8(seed_hex);
		if (Number.isInteger(index)) {
			var uint8 = int_uint8(index, 4);
			var context = blake2bInit(32, null);
			blake2bUpdate(context, seed);
			blake2bUpdate(context, uint8.reverse());
			var key = uint8_hex(blake2bFinal(context));
			return key;
		}
		else {
			this.error('Invalid index');
			return false;
		}
	}
	else {
		this.error('Invalid seed');
		return false;
	}
}


Rai.prototype.publicFromPrivateKey = function(secretKey) {
	
	if(!/[0-9A-F]{64}/i.test(secretKey)) {
		this.error = "Invalid secret key. Should be a 32 byte hex string.";
		return false;
	}
	
	return uint8_hex(nacl.sign.keyPair.fromSecretKey(hex_uint8(secretKey)).publicKey);
}


Rai.prototype.signBlock = function(blockHash, secretKey) {
	
	if(!/[0-9A-F]{64}/i.test(secretKey)) {
		this.error = "Invalid secret key. Should be a 32 byte hex string.";
		return false;
	}
	
	if(!/[0-9A-F]{64}/i.test(blockHash)) {
		this.error = "Invalid block hash. Should be a 32 byte hex string.";
		return false;
	}
	
	return uint8_hex(nacl.sign.detached(hex_uint8(blockHash), hex_uint8(secretKey)));
}

Rai.prototype.checkSignature = function(hexMessage, hexSignature, publicKeyOrXRBAccount) {
	
	if(!/[0-9A-F]{128}/i.test(signature)) {
		this.error = "Invalid signature. Needs to be a 64 byte hex encoded ed25519 signature.";
		return false;
	}
	
	if(/[0-9A-F]{64}/i.test(publicKeyOrXRBAccount)) {
		// it's a 32 byte hex encoded key
		return nacl.sign.detached.verify(hex_uint8(hexMessage), hex_uint8(hexSignature), hex_uint8(publicKeyOrXRBAccount));
	}
	else
	{
		var pubKey = this.ext_account_key (publicKeyOrXRBAccount);
		if(pubKey) {
			// it's a XRB account
			return nacl.sign.detached.verify(hex_uint8(hexMessage), hex_uint8(hexSignature), hex_uint8(pubKey));
		}
		this.error = "Invalid public key or XRB account.";
		return false;
	}
}


/**
 * Computes the block hash given its type and the required parameters
 * Parameters should be hex encoded (block hashes, accounts (its public key) and balances)
 * 
 * @param {string} blockType - send, receive, change and open
 * @param {object} parameters - {previous: "", destination: "", balance: ""}	 (send)
 *								{previous: "", source: ""}						 (receive)
 *								{previous: "", representative: "" } 		     (change)
 *								{source:   "", representative: "", account: "" } (open)
 * @returns {string} The block hash
 */
Rai.prototype.computeBlockHash = function(blockType, parameters)
{

	if(
		blockType == 'send' &&    ( 
									!/[0-9A-F]{64}/i.test(parameters.previous) ||
									!/[0-9A-F]{64}/i.test(parameters.destination) ||
									!/[0-9A-F]{32}/i.test(parameters.balance)
								  ) ||
		
		blockType == 'receive' && ( 
									!/[0-9A-F]{64}/i.test(parameters.previous) || 
									!/[0-9A-F]{64}/i.test(parameters.source) 
								  ) ||
		
		blockType == 'open' &&    (
									!/[0-9A-F]{64}/i.test(parameters.source) ||
									!/[0-9A-F]{64}/i.test(parameters.representative) ||
									!/[0-9A-F]{64}/i.test(parameters.account) 
								  ) ||
		
		blockType == 'change' &&  ( 
									!/[0-9A-F]{64}/i.test(parameters.previous) ||
									!/[0-9A-F]{64}/i.test(parameters.representative)
								  )
	)
	{
		this.error = "Invalid parameters.";
		return false;
	}
	
	var hash;
    
    switch(blockType)
    {
        case 'send':
            var context = blake2bInit(32, null);
            blake2bUpdate(context, hex_uint8(parameters.previous));
            blake2bUpdate(context, hex_uint8(parameters.destination));
            blake2bUpdate(context, hex_uint8(parameters.balance));
            hash = uint8_hex(blake2bFinal(context));
            break;
        
        case 'receive':
            var context = blake2bInit(32, null);
            blake2bUpdate(context, hex_uint8(parameters.previous));
            blake2bUpdate(context, hex_uint8(parameters.source));
            hash = uint8_hex(blake2bFinal(context));
            break;
        
        case 'open':
            var context = blake2bInit(32, null);
            blake2bUpdate(context, hex_uint8(parameters.source));
            blake2bUpdate(context, hex_uint8(parameters.representative));
            blake2bUpdate(context, hex_uint8(parameters.account));
            hash = uint8_hex(blake2bFinal(context));
            break;
        
        case 'change':
            var context = blake2bInit(32, null);
            blake2bUpdate(context, hex_uint8(parameters.previous));
            blake2bUpdate(context, hex_uint8(parameters.representative));
            hash = uint8_hex(blake2bFinal(context));
            break;
        
        default:
            this.error = "Invalid block type.";
            return false;
    }
    
    return hash;
}