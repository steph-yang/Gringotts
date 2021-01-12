## Load data into Hbase

### 1. Upload csv file to S3 through brrowser

### 2. Make directory in HDFS and copy file to HDFS

```bash
hdfs dfs -mkdir /tmp/stephyang/project/balance

s3-dist-cp --src s3://stephyang-mpcs53014/project/stephyang_prj_balance.csv --dest /tmp/stephyang/project/balance

```

### 3. Create Hive file and check output

```sql
create external table stephyang_prj_balance (
  usr string,
  coin string,
  quant bigint
  )
ROW FORMAT DELIMITED
FIELDS TERMINATED BY ','
STORED AS TEXTFILE
LOCATION '/tmp/stephyang/project/balance'
tblproperties ("skip.header.line.count"="1");

```



### 4. Transfer to HBase

First, create empty table in hbase
```bash
create 'stephyang_prj_balance', 'dat'
```

```sql
create external table stephyang_prj_balance_hbase (
  usr_coin string,
  quant bigint)
STORED BY 'org.apache.hadoop.hive.hbase.HBaseStorageHandler'
WITH SERDEPROPERTIES ('hbase.columns.mapping' = ':key, dat:quant#b');

insert overwrite table stephyang_prj_balance_hbase
select concat(usr, coin), quant from stephyang_prj_balance;

```

