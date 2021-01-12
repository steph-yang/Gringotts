from pycoingecko import CoinGeckoAPI 
import pandas as pd
import time



def hisorical_data(start="2020-11-12", end="2020-11-20"):
	'''
	Fetch data through API
	Notice: API breaks sometimes, so I set 10s sleep period for each 10 calls,
			but this makes the running time even longer. It takes around 36 hours
			for fecthing one week data.
	'''
	date_list = pd.date_range(start="2020-11-12",end="2020-11-20").tolist()
	date_list = [d.strftime("%d-%m-%Y") for d in date_list]

	coin_list = get_coin_list()
	price = []

	clock = 0
	c_len = len(coin_list)
	d_len = len(date_list)
	c = 0

	while c < c_len:
		d = 0
		while d < d_len:
			coin = coin_list[c]
			date = date_list[d]
			data = cg.get_coin_history_by_id(coin, date)
			if "market_data" in data:
				data = data["market_data"]["current_price"]
				for k, v in data.items():
					price.append({"id": coin, "date":date, "currency":k, "value":v})
			else:
				price.append({"id": coin, "date":date, "currency":"", "value":""})
			print(coin, date)
			clock += 1
			if clock == 10:
				time.sleep(10)
				clock = 0
			d += 1
		c += 1
	return price




def update_date(price):
	'''
	Change format of date from 30-11-2020 to 2020-11-30
	'''
	for p in price:
		s = p["date"]
		p["date"] = s[-4:]+ s[2:-4] + s[:2]
	return price



def clean_dataset():
	'''
	Reshape dataset to fit HBase
	Fill in NaN values
	Concat coin and date as one column
	Save data to local
	'''
	df = pd.DataFrame(price)
	df['coin_day'] = df['id'].str.cat(df['date'],sep="")
	df = df.drop(columns=['id', 'date'])
	df["value"] = df.value.replace('', -1.0)
	df = df.pivot_table(index='coin_day',columns='currency',values='value').fillna(-1).reset_index().drop(columns=[''])
	df.to_csv("price.csv", index=False)
	return



def get_coin_list():
	'''
	Get list of all coins
	'''
	cg = CoinGeckoAPI()
	coin_list = cg.get_coins_list()
	return [c["id"] for c in coin_list]


if __name__ == '__main__':
	price = hisorical_data()
	price = update_date(price)
	clean_dataset()

