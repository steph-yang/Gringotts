'use strict';
const http = require('http');
var assert = require('assert');
const express= require('express');
const app = express();
const mustache = require('mustache');
const filesystem = require('fs');
const url = require('url');
const port = Number(process.argv[2]);
const fetch = require('node-fetch');

const hbase = require('hbase');
var hclient = hbase({ host: process.argv[3], port: Number(process.argv[4])});


app.use(express.static('public'));
app.get('/hist.html',function (req, res) {
    var coin=req.query['coin'];
	var quant=req.query['quantity'];
	var from_date=req.query['from_date'];
	var end_date=req.query['end_date'];
	var target=req.query['target'];

	var coin_from = coin + from_date;
	var coin_end = coin + end_date;
	var target_from = target + from_date;
	var target_end = target + end_date;

	hclient.table('stephyang_prj_price').scan({

		filter: {
			"op":"MUST_PASS_ONE","type":"FilterList","filters":[
				{"op": "MUST_PASS_ALL", "type": "FilterList", "filters": [
						{	"op": "LESS_OR_EQUAL",
							"type": "RowFilter",
							"comparator": {"value": coin_end, "type": "BinaryComparator"}
						},
						{	"op": "GREATER_OR_EQUAL",
							"type": "RowFilter",
							"comparator": {"value": coin_from, "type": "BinaryComparator"}
						}]
				},
				{"op": "MUST_PASS_ALL", "type": "FilterList", "filters": [
						{	"op": "LESS_OR_EQUAL",
							"type": "RowFilter",
							"comparator": {"value": target_end, "type": "BinaryComparator"}
						},
						{	"op": "GREATER_OR_EQUAL",
							"type": "RowFilter",
							"comparator": {"value": target_from, "type": "BinaryComparator"}
						}]
				}
			]
		}
	},		(err, cells) => {
		if(!cells) {
			return "Record Not Found";
		}
		const exchangeInfo = computeMedium(cells, coin, target, quant);

		var template = filesystem.readFileSync("mustache/historical.mustache").toString();

		var html = mustache.render(template,  {
			info: JSON.stringify(exchangeInfo),
		});
		res.send(html);
	});
});


/* Send simulated weather to kafka */
var kafka = require('kafka-node');
var Producer = kafka.Producer;
var KeyedMessage = kafka.KeyedMessage;
var kafkaClient = new kafka.KafkaClient({kafkaHost: process.argv[5]});
var kafkaProducer = new Producer(kafkaClient);

app.get('/oneday.html',function (req, res){
	const coin=req.query['coin'];
	const date=req.query['d'];
	const date2 = date.slice(8, date.length) + date.slice(4,8) + date.slice(0,4);

	hclient.table('stephyang_prj_price').row(coin+"2020*").get(['dat:usd'],
		(error, value) => {
			var template = filesystem.readFileSync("mustache/error.mustache").toString();
			if(value === null){
				var html = mustache.render(template,  {
					message: "Invalid Coin input! Please check the CoinGecko link"
				});
				res.send(html);
			} else if(Date.parse(date) >= Date.parse(Date())){
				var html = mustache.render(template,  {
					message: "Invalid Date input!"
				});
				res.send(html);
			} else {
				var l = `https://api.coingecko.com/api/v3/coins/${coin}/history?date=${date2}`;
				async function returnRealTimeData(l) {

					var rv= await fetchRealTimeData(l);
					var template = filesystem.readFileSync("mustache/realtime.mustache").toString();
					var  dic = {};
					dic[coin] = rv["market_data"]["current_price"];
					var html = mustache.render(template,  {
						info: JSON.stringify(dic)
					});
					dic = dic[coin];
					dic["coin_day"] = coin+date;
					kafkaProducer.send([{ topic: 'stephyang_coin_price', messages: JSON.stringify(dic)}],
						function (err, data) {
							console.log("Kafka Error: " + err);
							res.send(html);
						});
				};
				returnRealTimeData(l);
			}
		});
});


app.get('/vault.html',function (req, res) {
	const user = req.query['user'];
	const pwd = req.query['pwd'];

	hclient.table('stephyang_prj_usr').row(user).get(['dat:pwd'],
		(error, value) => {
			if(value === null){
				var template = filesystem.readFileSync("mustache/error.mustache").toString();
				var html = mustache.render(template,  {
					message: "User does not exist!"
				});
				res.send(html);
				return
			} else {
				if (value[0]["$"] === pwd) {
					hclient.table('stephyang_prj_balance').row(user+"*").get(['dat:quant'],
						(error, cells) => {
							if(!cells) {
								var template = filesystem.readFileSync("mustache/error.mustache").toString();
								var html = mustache.render(template,  {
									message: "Empty Vault! :("
								});
								res.send(html);
								return
							}
							var balance = {"coin":{}};
							cells.forEach(function (item){
								var l = user.length;
								var coin = item["key"].slice(l, item["key"].length);
								balance["coin"][coin] = counterToInt(item['$']);
							});

							var coin = Object.keys(balance["coin"]);

							var all_currency = 'AED,ARS,AUD,BCH,BDT,BHD,BMD,BNB,BRL,BTC,CAD,CHF,CLP,CNY,CZK,DKK,DOT,' +
								'EOS,ETH,EUR,GBP,HKD,HUF,IDR,ILS,INR,JPY,KRW,KWD,LINK,LKR,LTC,MMK,MXN,MYR,NGN,NOK,NZD,' +
								'PHP,PKR,PLN,RUB,SAR,SEK,SGD,THB,TRY,TWD,UAH,USD,VEF,VND,XAG,XAU,XDR,XLM,XRP,YFI,ZAR';

							var l = `https://api.coingecko.com/api/v3/simple/price?ids=${coin}&vs_currencies=${all_currency}`;
							const time = new Date(Date.now()).toLocaleString("en-US", {timeZone: 'America/Chicago'});
							async function returnRealTimeData(l) {
								var realtime= await fetchRealTimeData(l);

								var template = filesystem.readFileSync("mustache/login.mustache").toString();
								var html = mustache.render(template,  {
									table_1: JSON.stringify(balance),
									table_2: JSON.stringify(realtime),
									time:time
								});
								res.send(html);
							};
							returnRealTimeData(l);
						});
				} else {
					var template = filesystem.readFileSync("mustache/error.mustache").toString();
					var html = mustache.render(template,  {
						message: "Incorrect Password!"
					});
					res.send(html);
				}
			}
		});
});

app.get('/reg.html',function (req, res){
	const user=req.query['user'];
	const pwd=req.query['pwd'];

	var dic = {
		user: user,
		pwd:pwd
	}

	kafkaProducer.send([{ topic: 'stephyang_user_registration', messages: JSON.stringify(dic)}],
		function (err, data) {
				var template = filesystem.readFileSync("mustache/error.mustache").toString();
				if(err !== null){
					var html = mustache.render(template,  {
						message: err
					});
				}  else {
					var html = mustache.render(template,  {
						message: "Successfully Registered!"
					});
				}
			res.send(html);
		});
});

app.get('/buy.html',function (req, res) {
	const user = req.query['user'];
	const pwd = req.query['pwd'];
	const coin = req.query['coin'];
	const quant = req.query['quant'];

	hclient.table('stephyang_prj_usr').row(user).get(['dat:pwd'],
		(error, value) => {
			var template = filesystem.readFileSync("mustache/error.mustache").toString();

			if(value !== null){
				if (value[0]["$"] === pwd) {
					var key = user+coin;
					hclient.table('stephyang_prj_balance').row(key).get(['dat:quant'],
						(error, cells) => {
							if(!cells) {
								async function returnRealTimeData(coin, key, quant, template) {
									var all_coins = await fetchRealTimeData("https://api.coingecko.com/api/v3/coins/list");
									var coin_id = all_coins.map(function (all_coins) {return all_coins.id});
									if(! coin_id.includes(coin)){
										var message =  "Incorrect Coin Id!";
										var html = mustache.render(template,  {message: message});
										res.send(html);
									} else {
										var message = "Data Added";
										var dic = {};
										dic["user"] = key;
										dic["quant"] = quant;
										kafkaProducer.send([{ topic: 'stephyang_balance', messages: JSON.stringify(dic)}],
											function (err, data) {
												console.log("Kafka Error: " + err)
											});
										var html = mustache.render(template,  {message: message});
										res.send(html);
									}

								};
								returnRealTimeData(coin, key, quant, template);

							} else {
								var dic = {};
								dic["user"] = user + coin;
								dic["quant"] = quant;
								kafkaProducer.send([{ topic: 'stephyang_balance', messages: JSON.stringify(dic)}],
									function (err, data) {
										console.log("Kafka Error: " + err)
									});
								var message = "Data Incremented!";
								var html = mustache.render(template,  {message: message});
								res.send(html);
							}
						});
				} else {
					var message = "Incorrect Password!";
					var html = mustache.render(template,  {message: message});
					res.send(html);
				}
			} else {
				var message = "User does not exist!";
				var html = mustache.render(template,  {message: message});
				res.send(html);
			}
		});
});


app.listen(port);





////////////////////////////////////////////////////////////

// Function for realtime page (speed layer API)

async function fetchRealTimeData(l) {
	try {
		const response = await fetch(l, {
			method: 'GET',
			credentials: 'include'
		});
		const rv = await response.json();
		return rv;
	} catch (error) {
		console.error(error);
	}
};

// Function for historical page (batch layer query)
function computeMedium(row, coin, target, quant=100) {
	var stats = {}
	row.forEach(function (item) {
		var l = item["key"].length;
		var year = item["key"].slice(-10, l);
		var type = item["key"].slice(0, -10);

		if(stats[year] === undefined ){
			stats[year] = {}
		}

		if(type===coin){
			if(counterToNumber(item['$']) === -1){
				stats[year][item['column']] = "NA";
			}
			if(stats[year][item['column']] !== "NA") {
				if (stats[year][item['column']] === undefined){
					stats[year][item['column']] = counterToNumber(item['$'])
				} else {
					stats[year][item['column']] *= counterToNumber(item['$'])
				}
			} else {
				stats[year][item['column']] = "NA"
			}
		}


		if(type===target){
			if(counterToNumber(item['$']) === -1){
				stats[year][item['column']] = "NA";
			}
			if(stats[year][item['column']] !== "NA") {
				if (stats[year][item['column']] === undefined){
					stats[year][item['column']] = quant/counterToNumber(item['$'])
				} else {
					stats[year][item['column']] /= counterToNumber(item['$'])/quant
				}
			} else {
				stats[year][item['column']] = "NA"
			}
		}
	});
	return stats;
}


function counterToNumber(c) {
	return Number(Buffer.from(c).readFloatBE());
}


function counterToInt(c) {
	return Number(Buffer.from(c).readBigInt64BE());
}
