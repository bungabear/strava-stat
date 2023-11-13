
const fetcher = require('../src/index');

(async function(){
    let res = await fetcher.fetch({
        clientId: '',
        clientSecret: '',
        refreshToken: '',
    });
    console.log(res);
})()
