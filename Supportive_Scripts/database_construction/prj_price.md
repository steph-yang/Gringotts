## Load data into Hbase

### 1. Upload csv file to S3 through brrowser

### 2. Make directory in HDFS and copy file to HDFS

```bash
hdfs dfs -mkdir /tmp/stephyang/project/price

s3-dist-cp --src s3://stephyang-mpcs53014/project/stephyang_prj_price.csv --dest /tmp/stephyang/project/price

```

### 3. Create Hive file and check output

```sql
create external table stephyang_prj_price (
  coin_day string,
  aed float,ars float,aud float,bch float,bdt float,bhd float,bmd float,bnb float,brl float,btc float,cad float,chf float,clp float,cny float,czk float,dkk float,dot float,eos float,eth float,eur float,gbp float,hkd float,huf float,idr float,ils float,inr float,jpy float,krw float,kwd float,link float,lkr float,ltc float,mmk float,mxn float,myr float,ngn float,nok float,nzd float,php float,pkr float,pln float,rub float,sar float,sek float,sgd float,thb float,try float,twd float,uah float,usd float,vef float,vnd float,xag float,xau float,xdr float,xlm float,xrp float,yfi float,zar float)
ROW FORMAT DELIMITED
FIELDS TERMINATED BY ','
STORED AS TEXTFILE
LOCATION '/tmp/stephyang/project/price'
tblproperties ("skip.header.line.count"="1");


select * from stephyang_prj_price limit 1;

```



### 4. Transfer to HBase

First, create empty table in hbase
```bash
create 'stephyang_prj_price', 'dat'
```

```sql
create external table stephyang_prj_price_hbase (
  coin_day string,
  aed float,ars float,aud float,bch float,bdt float,bhd float,bmd float,bnb float,brl float,btc float,cad float,chf float,clp float,cny float,czk float,dkk float,dot float,eos float,eth float,eur float,gbp float,hkd float,huf float,idr float,ils float,inr float,jpy float,krw float,kwd float,link float,lkr float,ltc float,mmk float,mxn float,myr float,ngn float,nok float,nzd float,php float,pkr float,pln float,rub float,sar float,sek float,sgd float,thb float,try float,twd float,uah float,usd float,vef float,vnd float,xag float,xau float,xdr float,xlm float,xrp float,yfi float,zar float)
STORED BY 'org.apache.hadoop.hive.hbase.HBaseStorageHandler'
WITH SERDEPROPERTIES ('hbase.columns.mapping' = ':key, dat:aed#b,dat:ars#b,dat:aud#b,dat:bch#b,dat:bdt#b,dat:bhd#b,dat:bmd#b,dat:bnb#b,dat:brl#b,dat:btc#b,dat:cad#b,dat:chf#b,dat:clp#b,dat:cny#b,dat:czk#b,dat:dkk#b,dat:dot#b,dat:eos#b,dat:eth#b,dat:eur#b,dat:gbp#b,dat:hkd#b,dat:huf#b,dat:idr#b,dat:ils#b,dat:inr#b,dat:jpy#b,dat:krw#b,dat:kwd#b,dat:link#b,dat:lkr#b,dat:ltc#b,dat:mmk#b,dat:mxn#b,dat:myr#b,dat:ngn#b,dat:nok#b,dat:nzd#b,dat:php#b,dat:pkr#b,dat:pln#b,dat:rub#b,dat:sar#b,dat:sek#b,dat:sgd#b,dat:thb#b,dat:try#b,dat:twd#b,dat:uah#b,dat:usd#b,dat:vef#b,dat:vnd#b,dat:xag#b,dat:xau#b,dat:xdr#b,dat:xlm#b,dat:xrp#b,dat:yfi#b,dat:zar#b')
TBLPROPERTIES ('hbase.table.name' = 'stephyang_prj_price');

insert overwrite table stephyang_prj_price_hbase
select * from stephyang_prj_price;


```

