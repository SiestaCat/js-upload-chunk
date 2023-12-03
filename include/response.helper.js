const parse_json = function(response, callback)
{
    let response_json = response.hasOwnProperty('responseJSON') ? response.responseJSON : response;

    if(!(typeof response_json === 'object'))
    {
        callback(true, false, response, null);
        return;
    }

    if(!(response_json.hasOwnProperty('success') && response_json.success === true))
    {
        callback(true, true, response_json, (response_json.hasOwnProperty('error') ? response_json.error : null));
        return;
    }

    if(response.hasOwnProperty('status') && response.status != 200)
    {
        callback(true, true, response, null);
        return;
    }

    callback(false, true, response_json, null);
}

module.exports = 
{
    'parse_json' : parse_json
};