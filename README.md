# rate-limiter-assignment
A Node.js / Express / TypeScript API demonstrating API throttling with two rate-limiting algorithms, two storage strategies, and per-client configurable policies.

## Problem Statement :

The task is to develop an API that demonstrates API throttling, you will implement two GET endpoints: /foo and /bar . Each of
these endpoints will include rate limiting to regulate the number of requests permitted within a defined time frame. We recommend
you spend around 4 hours on this task.

All request will have authentication in the form of an Authorization header containing a clientID to authorise a specific client.
this has the following format Authorization : bearer <client-id> .


/foo and /bar should leverage different rate limiting algorithms.


Both endpoints should return 200 - { succes:true } when rate limit is not reached.


Both endpoints should return 429 - { error: 'rate limit exceeded'} when rate limit is reached.


Each client (defined by the Authorization header) should have a configurable rate limit.


We want at least 2 supported clients with different rate limits.


We want you to implement 2 storage strategies for the rate limit counters. 1 in memory and 1 in persistent storage.


Be prepared to demonstrate the working functionality for at least 2 clients calling both endpoints with both storage strategies.


Your solution should contain at least 1 test.


## Requirements :

### Rate limiting

regulate number of requests within a window - configurable

define a variable or dynamic window - configurable

rate limiter configurable enough to be applied globally and client specific

rate limiting can be disabled.



### Client ID :

simplified validation for client ids using preferably cryptic with fish encryption

should be easy to add new client id or remove a client id

restrict a client id



### Storage Scheme:

in memory is dropped leverage redis? - To be decided later

leverage RDS or inhouse docker deployable PGSQL

correctly handled pool and connections currently

rules - each client will borrow connection from pool



## Additional Rules:


client Id  - The main entity

rate limiter - A logical constrain

storage  - A  data binder



client id is registered based on the configuration of client specific details

client id must acquire a rate limiter

client id can not disable the rate limiter applied

client id can change the rate limiter - question what will be the impact on concurrant active requests

client id can pic the rate limiter with the algorithm it can provide

client id can override rate limitters storage mechanism

A client can be disabled leading to not accepting any further requests



a broder concept is a configurable module that can provide the combination of rate limiter algorithm, storage which can be registered per client something called policy



1. spamming restrictions if a specific ip keeps requesting beyond limits - Not in the scope



### questions?

can we leverage the exponential back off startergies like RAMP apis uses with cool down period - not in scope

what will be the impact on dynamic api rate limitting switch?

trigger event when a rate limitter is about to or has reached the limits with a request context - not in scope

how easy ot configurable it is to add a new client with all the details - we should make via api or config file?





### Tools:

nodejs, pgsql, redis,  a docker

docker setup
```


                Client
                  │
                  ▼
            Authentication
                  │
                  ▼
           Client Resolution
                  │
                  ▼
          Policy Resolution
                  │
                  ▼
             Rate Limiter
              /        \
             /          \
    Token Bucket      Sliding Window
         │                  │
         └────────┬─────────┘
                  ▼
               Storage
              /       \
         Memory      PostgreSQL
                  │
                  ▼
                 Event
                  │
                  ▼
             Event Consumer

```