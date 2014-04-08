# aspera-tokengen

aspera-tokengen is a small node.js webservice that signs aspera file transfer requests providing tokens back to the caller.

## Sample configuration

```
{
  "astokengen" : "/opt/aspera/bin/astokengen",
  "host" : "0.0.0.0",
  "port" : 9999,
  "workers" : 1,
  "ssl" : {
    "key" : "key",
    "cert" : "cert",
    "ca" : "ca"
  }
}
```
