# The Malloy Extension

The [Malloy Extension](https://marketplace.visualstudio.com/items?itemName=malloydata.malloy-vscode) is an authoring enironments for Malloy models. It contains helpful features like schema browsing, query running, language auto-complete, help & documentation, and rudimentary visualizations.

The Extension can be installed anywhere that VS Code runs - either locally on your machine, or in a variety of sites that provide the VS Code interface.

<img class="small-img" src="{{site.baseurl}}/img/running_extension.gif">

***NOTE:***  Because there are two versions of VS Code - VS Code Desktop and [VS Code Web](https://code.visualstudio.com/docs/editor/vscode-web) - there are times when only specific databases are available. When running on a desktop, the Malloy Extension can execute database queries against any supported database, such as BigQuery, PostGres, or DuckDB. When running VS Code Web, the Malloy Extension can only communicate with a browser-based version of DuckDB that comes pre-packaged with the Extension.

## Using the Malloy Extension on your Desktop

1. **Download Visual Studio Code**: If you don't already have it, download [Visual Studio Code](https://code.visualstudio.com/)

2. **Add the Malloy Extension**: Open VS Code and click the Extensions button on the far left (it looks like 4 blocks with one flying away). This will open the Extension Marketplace. Search for "Malloy" and, once found, click "Install"

3. **Download and unzip the [Sample Models](https://malloydata.github.io/malloy/aux/generated/samples.zip)**

4. **Open the samples folder in VS Code:** In VS Code, go to File > **Open Folder**... select samples/duckdb > Open. DuckDB is built into the extension so you're ready to run these.

## Using the Malloy Extension on Google Cloud Shell Editor
Google Cloud customers have access to a built-in integrated development environment (IDE) running the Desktop version of VS Code, and Malloy can run in this environment access data in BigQuery, Postgres or DuckDB. Running Malloy here only takes a few clicks:

1. **Launch the Google Cloud Shell**

Goto https://shell.cloud.google.com

1. **Install Malloy Extension & Examples:**
The command below will install Malloy into your cloud shell account. Run the following command and replace [PROJECT_ID] with a project where you have permissions to run BigQuery queries (if you open a BigQuery console, you should see the project name on the top line).

```
curl -sL \
  https://github.com/malloydata/malloy/raw/main/scripts/cloud/update_malloy.sh \
  | bash -s [PROJECT_ID]
```

3. **Open the Cloud Shell Editor:**

Go to https://ide.cloud.google.com and open your "Home Workspace".

<img class="small-img" src="{{site.baseurl}}/img/setup_ide_home.png">

You should see the directory called 'Malloy Samples'.

4. **Verify that BigQuery connects correctly:**

In the IDE Editor open `malloy-samples/bigquery/faa/airports.malloy` and scroll down click the 'Run' code lens above one of the queries.  You should see query results.

<img class="small-img"src="{{site.baseurl}}/img/setup_ide_run.png">

### Changing the Project ID
If you need to modify the Google CLoud Project ID, open the settings by clicking the lower-left corner gear icon, search for "project," and enter the project ID for Cloudshell:Project

<img class="small-img"src="{{site.baseurl}}/img/setup_ide_project.png">

## Using the Malloy Extension on github.dev

***NOTE:*** github.dev uses the Web version of VS Code, so it is only possible to interact with local data. If you have data stored in CSVs, JSON files, or Parquet files in your repository, you can query that data in the Malloy Extension directly from your browser

If you are logged into Github, any repository on Github can be opened into a web-only VS Code instance with all the files in the repository loaded into your browser memory. Simply press `.` on the main repo page, or change the url from `https://github.com/{repo-name}` to `https://github.dev/{repo-name}`.

Once you have opened the repository on github.dev, install the Malloy extension by clicking the Extensions button on the far left (it looks like 4 blocks with one flying away). This will open the Extension Marketplace. Search for "Malloy" and, once found, click "Install".

DuckDB is available without needing to explicitly configure a connection - you can simply reference your local files in the `source` of the Malloy model, i.e. `source: my_data_table is table('duckdb:my_file.csv')`