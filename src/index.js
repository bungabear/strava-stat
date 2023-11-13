const StravaConfig = require('./config');
const strava = require('strava-v3')

async function getAccessToken(refreshToken) {
    try{
        const res = await strava.oauth.refreshToken(refreshToken);
        if(res?.access_token != null){
            return res.access_token;
        }
    }
    catch(e){
        console.error(e);
    }
    throw new Error("Fail to get access token");
}

async function getMyAthleteId({accessToken}) {
    try{
        let profile = await strava.athlete.get({'access_token': accessToken});
        if(profile?.id != null){
            return profile.id;
        }
    }
    catch(e){
        console.error(e);
    }
    throw new Error("Fail to get athlete id");
}

async function getAthleteStats({accessToken, id}) {
    try{
        let res = await strava.athletes.stats({'access_token': accessToken, 'id': id});
        if(res != null){
            return res;
        }
    }
    catch(e){
        console.error(e);
    }
    throw new Error("Fail to get athlete stats");
}

async function fetch({clientId, clientSecret, refreshToken} = {}) {
    clientId = clientId ?? StravaConfig.clientId;
    clientSecret = clientSecret ?? StravaConfig.clientSecret;
    refreshToken = refreshToken ?? StravaConfig.refreshToken;

    if(clientId == null){
        throw new Error("clientId is null");
    }
    
    if(clientSecret == null){
        throw new Error("clientSecret is null");
    }
    
    if(refreshToken == null){
        throw new Error("refreshToken is null");
    }

    strava.config({
        "client_id"     : clientId,
        "client_secret" : clientSecret,
    })
    const accessToken = await getAccessToken(refreshToken);
    let id = await getMyAthleteId({accessToken});
    let myStats = await getAthleteStats({accessToken, id});
    if(myStats != null){
        console.info('my strava stats fetch success')
    }
    return myStats;
}

module.exports = {
    fetch,
    getAccessToken,
    getAthleteStats,
    getMyAthleteId,
};