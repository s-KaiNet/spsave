## Performance testing

Testing scenario: 50 different files, all 5-10KB are getting uploaded to SharePoint (on premise and Online) with legacy `spsave 1.x` and `spsave 2.x`. One test is series upload (all 50 files one by one), another test is parallel upload (all 50 files at the same time).  

 Results:
 ```
 50 files upload: in series
--------------------------------
spsave      on-premise  online
----------  ----------  --------
spsave 1.x  6.694s      131.946s
spsave 2.x  4.243s      43.794s

50 files upload: in parallel
------------------------------
spsave      on-premise  online
----------  ----------  ------
spsave 1.x  1.489s      5.6s
spsave 2.x  1.732s      5.241s
``` 

These results are average from about 10 runs on my environment. You see that performance is almost the same for all scenarios except SharePoint Online series uploads. It becomes 3x faster thankfully to caching of digest and cookies (inside [sp-request](https://github.com/s-KaiNet/sp-request) module).