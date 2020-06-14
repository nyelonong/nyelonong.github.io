---
layout: post
title:  "How I Always Got 2k Locker Code Update"
date:   2020-06-14 08:18:35 +0700
categories: blog
---

I love NBA 2K MyTeam. MyTeam is a game mode in the NBA 2K series that allows you to build your own team, consisting of former and current NBA players. You have the ability to customize your team's franchise and appearance. MyTeam has several different gamemodes inside of it. 

Sometimes, they relase a locker code. Locker code is text code that you enter into the game that most often rewards you with a free player or pack in NBA 2K20 MyTeam.

Luckily, there is a [website](https://www.nba2k.io/20/active-locker-codes/) that always update new locker code so we don't need to wait someone to share locker code on twitter or other media.

With this easiness, I still too lazy to check their website everyday or every couple hours. Luckily again, they use [naked API](https://www.nba2k.io/page-data/20/active-locker-codes/page-data.json) as their datasource. So I plan to develop an automation that can check every hour and send me the fresh locker code.

Because I am so lazy, I will use [AWS Lambda](https://aws.amazon.com/lambda/) and [AWS Cloudwatch Events](https://docs.aws.amazon.com/AmazonCloudWatch/latest/events/ScheduledEvents.html).

AWS Lambda lets us run code without provisioning or managing servers. With that we only need to care about our code. And AWS Cloudwatch Events is our cronjob.

I will use python, you can choose other language option if you want.

![create lambda function]({{ site.baseurl }}/images/lambda--create-function.png)

We will just using the lambda web console since it will not take much code to do. Lambda function with python template is like this

{% highlight python %}
import json

def lambda_handler(event, context):
    # TODO implement
    return {
        'statusCode': 200,
        'body': json.dumps('Hello from Lambda!')
    }
{% endhighlight %}

We will cloudwatch event as out trigger with no input paramater, so we will not use the event param. 

First step, I will call the locker code datasource API that return json body. We need requests library. But since I code in web console, I can not add external package. So let use requests from botocore

{% highlight python %}
from botocore.vendored import requests

data = requests.get("https://www.nba2k.io/page-data/20/active-locker-codes/page-data.json").json()
{% endhighlight %}

I already get the data in json dict. I wanna get all the active locker code, so I need to filter out the expired keys. I also need to sync the timezone before comparing datetime.

{% highlight python %}
import dateutil.tz
import dateutil.parser
from datetime import datetime as dt

edges = data["result"]["data"]["allLockerCodes"]["edges"]
msg = ""

for edge in edges:
    code = edge["node"]["lockerCode"]
    title = edge["node"]["title"]
    create = dateutil.parser.parse(edge["node"]["dateAdded"])
    expire_at = None
    if edge["node"]["expiration"] is not None:
        expire = dateutil.parser.parse(edge["node"]["expiration"])
        now = dt.now(tz=mountain)
        if now > expire:
            continue
        
        expire_at = expire.astimezone(tz=jakarta)
    
    msg += f"Title: {title}\nCode: {code}\nCreated At: {create.astimezone(tz=jakarta)}\nExpire At: {expire.astimezone(tz=jakarta)}\n\n"
    
{% endhighlight %}

OK now I have concanated message, what next? I wanna get update in my phone so I will use [telegram bot](https://core.telegram.org/bots).

Create telegram bot is very easy, I just need to chat [@BotFather](https://t.me/botfather). Type `/newbot` and follow the instruction. When it is done, I got token to access the HTTP API.

Back to my lambda console, I wanna use the environment variables to store the token and my telegram id.

![lambda env var]({{ site.baseurl }}/images/lambda--env-var.png)

This is my final code

{% gist 5d2830286b365edbc3750a629d1dc7a9 %}

And my last step is adding cloudwatch event as a trigger.

![lambda trigger]({{ site.baseurl }}/images/lambda--trigger.png)

All done. This is the result.

![telegram 2k]({{ site.baseurl }}/images/telegram--2k.png)
