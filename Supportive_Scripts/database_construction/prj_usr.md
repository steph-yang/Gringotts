## Load data into Hbase

### 1. Upload csv file to S3 through brrowser

### 2. Make directory in HDFS and copy file to HDFS

```bash
hdfs dfs -mkdir /tmp/stephyang/project/user

s3-dist-cp --src s3://stephyang-mpcs53014/project/stephyang_prj_user.csv --dest /tmp/stephyang/project/user

```

### 3. Create Hive file and check output

```sql
create external table stephyang_prj_usr (
  user string,
  pwd string)
ROW FORMAT DELIMITED
FIELDS TERMINATED BY ','
STORED AS TEXTFILE
LOCATION '/tmp/stephyang/project/user'
tblproperties ("skip.header.line.count"="1");


```



### 4. Transfer to HBase

First, create empty table in hbase
```bash
create 'stephyang_prj_usr', 'dat'
```

```sql
create external table stephyang_prj_usr_hbase (
  user string,
  pwd string)
STORED BY 'org.apache.hadoop.hive.hbase.HBaseStorageHandler'
WITH SERDEPROPERTIES ('hbase.columns.mapping' = ':key, dat:pwd#b')
TBLPROPERTIES ('hbase.table.name' = 'stephyang_prj_usr');

insert overwrite table stephyang_prj_usr_hbase
select * from stephyang_prj_usr;


```

