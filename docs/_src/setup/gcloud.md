# Setting up Malloy in Google Cloud IDE
Google Cloud customers have access to a built-in integrated development environment (IDE). Malloy in its various forms can run in this environment access data in BigQuery, Postgres or DuckDB. Running Malloy here only takes a few clicks.

## 1) Launch the Google Cloud Shell

Goto https://shell.cloud.google.com

## 2) Install Malloy Extension, Examples and Composer
The command below will install Malloy into your cloud shell account. Run the following command and replace [PROJECT_ID] with a project where you have permissions to run BigQuery queries (if you open a BigQuery console, you should see the project name on the top line).

```
curl -sL \
  https://github.com/malloydata/malloy/raw/main/scripts/cloud/update_malloy.sh \
  | bash -s [PROJECT_ID]
```

## 3) Open the Cloud Shell Editor

Go to https://ide.cloud.google.com and open your "Home Workspace".

<img src="{{site.baseurl}}/img/setup_ide_home.png">

You should see the directory called 'Malloy Samples'.

##  4) Verify that BigQuery connects correctly.

In the IDE Editor open `malloy-samples/bigquery/faa/airports.malloy` and scroll down click the 'Run' code lens above one of the queries.  You should see query results.

<img src="{{site.baseurl}}/img/setup_ide_run.png">

## Changing the Project for Malloy IDE
Open the settings by clicking the lower-left corner gear icon, search for "project," and enter the project ID for Cloudshell:Project

<img src="{{site.baseurl}}/img/setup_ide_project.png">

## Running Malloy Composer
1) Open a terminal (either in the IDE or shell).

2) Make sure your project ID is configured.

```
gcloud config set project [YOUR_PROJECT_ID]
```

3) Launch Composer

```
cd ~
./composer -p 8080 malloy-samples/composer.json
```

4) Open Malloy Composer in the browser. Click the Preview Button in the IDE and select port 8080.

<img src="{{site.baseurl}}/img/setup_ide_preview2.png" style="height: 192px; width:396px;">
