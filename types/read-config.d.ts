declare module 'read-config' {
  function readConfig(p: string): {accesslog: string};

  namespace readConfig { }
  export = readConfig;
}
