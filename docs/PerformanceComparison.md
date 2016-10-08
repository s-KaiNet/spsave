## Performance testing

Testing scenario: 50 different files, all 5-10KB are getting uploaded to SharePoint (on premise and Online) with legacy `spsave 1.x` and `spsave 3.x`. One test is series upload (all 50 files one by one), another test is parallel upload (all 50 files at the same time).  

Results:
 ```
50 files upload: in series
-----------------------------------------------------------------------------------------------------------------
spsave      on-premise user creds  on-premise addin only  online user creds  online addin only  adfs (on premise)
----------  ---------------------  ---------------------  -----------------  -----------------  -----------------
spsave 1.x  7.298s                 -                      100.114s           -                  -
spsave 3.x  3.243s                 2.389s                 21.086s            43.701s            2.291s

50 files upload: in parallel
-----------------------------------------------------------------------------------------------------------------
spsave      on-premise user creds  on-premise addin only  online user creds  online addin only  adfs (on premise)
----------  ---------------------  ---------------------  -----------------  -----------------  -----------------
spsave 1.x  2.678s                 -                      3.173s             -                  -
spsave 3.x  2.059s                 1.346s                 2.987s             1.019s             3.292s
``` 

From the results you see that latest version is much faster for online user credentials (thankfully to caching techniques), also online user credentials option is around 30% faster than online addin only option (in series uploads). My guess that when using addin only security, SharePoint performs additional validation of access token, and that takes additional time. So, for performance for SharePoint Online consider using user credentials authentication. 