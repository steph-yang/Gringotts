# Gringotts Digital Currency Exchange Center


## Introduction

This project has three main parts:

1. Historical digital coins data (batch layer). Those data are downloaded from CoinGecko using Python script (Supportive_Scripts/back_end/api.py). Because of the unstableness of the API, only data from 2020-11-12 to 2020-11-20 are downloaded. The data are transfered from s3 to Hive and Hbase manually.

2. Realtime search (speed layer). Search historical exchange rates of two coins for the given date. These data are retrieved from API in real time and will be saved in batch layer through kafka (topic: stephyang_coin_price).

3. Client Service. In this part, I create a client-oriented component that provides service including registration, login, deposit/withdraw, and check real-time quote price (this real time is different from #2 as it's real-time for now. "Real-time" in # 2 means realtime search for a historical date).

## Demo Video

https://www.youtube.com/watch?v=Z6n0GYikEkA&ab_channel=StephanieYang


## Pages:

1. Welcome.html: menu page
![](readmepic/welcome.jpg)
2. historical.html: check historical change rate between two coins
![](readmepic/hist.jpeg)
3. one_day.html: fetch realtime data
![](readmepic/realtime.jpg)
4. vault.html: check client's vault
![](readmepic/login.jpg)
5. registratioin.html: new client register
![](readmepic/reg.jpg)
6. trade.html: deposit or withdraw coins
![](readmepic/trade.jpg)


## File Structure

```
|-- README.md
|
|-- Final_Deliverable
|   |-- appspec.yml
|   |-- bin
|   |   |-- after_install.sh
|   |   |-- application_start.sh
|   |   |-- application_stop.sh
|   |   |-- before_install.sh
|   |
|   |-- src
|       |-- app.js
|       |-- package.json
|       |-- public
|       |   |-- welcome.html
|       |   |-- historical.html
|       |   |-- one_day.html
|       |   |-- login.html
|       |   |-- trade.html
|       |   |-- registration.html
|       |   |-- image
|       |   |-- style 
|       |-- mustache
|           |-- error.mustache
|           |-- historical.mustache
|           |-- realtime.mustache
|           |-- login.mustache
|
|-- Supportive_Scripts
    |-- back_end
    |   |-- api.py  (backend python script that scraps data via API)
    |-- database_construction
    |   |-- prj_price.md
    |   |-- prj_balance.md
    |   |-- prj_usr.md
    |-- original_data
            |-- price.csv
            |-- balance.csv
            |-- user.csv
```
## Link (expired)

http://ec2-3-15-219-66.us-east-2.compute.amazonaws.com:3233/welcome.html

## Database Name in Hbase (expired)

1. stephyang_prj_price: historical price data for batch and speed layers.
2. stephyang_prj_usr: user account name and password
3. stephyang_prj_balance: account balance data

## Kafka Topics & Corresponding Spark Jobs (expired)

1. stephyang_coin_price: topic for speed layer

```bash
# Kafka
cd /home/hadoop/kafka_2.12-2.2.1/bin
./kafka-console-consumer.sh --bootstrap-server b-2.mpcs53014-kafka.fwx2ly.c4.kafka.us-east-2.amazonaws.com:9092,b-1.mpcs53014-kafka.fwx2ly.c4.kafka.us-east-2.amazonaws.com:9092 --topic stephyang_coin_price

# Spark
cd stephyang/project/target
spark-submit --master local[2] --driver-java-options "-Dlog4j.configuration=file:///home/hadoop/ss.log4j.properties" --class StreamPrice uber-stephyang_project-1.0-SNAPSHOT.jar b-1.mpcs53014-kafka.fwx2ly.c4.kafka.us-east-2.amazonaws.com:9092,b-2.mpcs53014-kafka.fwx2ly.c4.kafka.us-east-2.amazonaws.com:9092

```

2. stephyang_user_registration: topic for client registration

```bash
# Kafka
cd /home/hadoop/kafka_2.12-2.2.1/bin
./kafka-console-consumer.sh --bootstrap-server b-2.mpcs53014-kafka.fwx2ly.c4.kafka.us-east-2.amazonaws.com:9092,b-1.mpcs53014-kafka.fwx2ly.c4.kafka.us-east-2.amazonaws.com:9092 --topic stephyang_user_registration

# Spark
cd stephyang/project/target
spark-submit --master local[2] --driver-java-options "-Dlog4j.configuration=file:///home/hadoop/ss.log4j.properties" --class StreamRegistration uber-stephyang_user_reg-1.0-SNAPSHOT.jar b-1.mpcs53014-kafka.fwx2ly.c4.kafka.us-east-2.amazonaws.com:9092,b-2.mpcs53014-kafka.fwx2ly.c4.kafka.us-east-2.amazonaws.com:9092
```

3. stephyang_user_balance: topic for deposit and withdraw coins

```bash
# Kafka
cd /home/hadoop/kafka_2.12-2.2.1/bin
./kafka-console-consumer.sh --bootstrap-server b-2.mpcs53014-kafka.fwx2ly.c4.kafka.us-east-2.amazonaws.com:9092,b-1.mpcs53014-kafka.fwx2ly.c4.kafka.us-east-2.amazonaws.com:9092 --topic stephyang_balance

# Spark
cd stephyang/project/target
spark-submit --master local[2] --driver-java-options "-Dlog4j.configuration=file:///home/hadoop/ss.log4j.properties" --class StreamBalance uber-stephyang_balance-1.0-SNAPSHOT.jar b-1.mpcs53014-kafka.fwx2ly.c4.kafka.us-east-2.amazonaws.com:9092,b-2.mpcs53014-kafka.fwx2ly.c4.kafka.us-east-2.amazonaws.com:9092
```


