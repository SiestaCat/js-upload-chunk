class ChunkUploadProcessAsync
{

    success_callback = () => {};

    progress_callback = () => {};

    error_callback = () => {};

    error_attempts = 0;

    error_attempts_limit = 10;


    constructor(url, request_id, files_count)
    {
        this.url = url;  
        this.request_id = request_id;
        this.files_count = files_count;
    }

    check_progress()
    {
        let _this = this;

        

        this.callAjax((response, is_error) => {
            if(!is_error)
            {
                if(response.process_status)
                {
                    return _this.success_callback(response);
                }

                let percent = response.pending === 0 ? 100 : Math.abs(((response.pending / _this.files_count) * 100) - 100);

                _this.progress_callback(percent);
            }
            
            setTimeout(() => _this.check_progress(), 500)
        });
    }

    

    callAjax(callback)
    {
        let _this = this;

        let form_data = {
            'request_id' : this.request_id
        };

        $.ajax({
            url: this.url, 
            type: 'POST',
            data: form_data,
            dataType: 'json',
            processData: true,
            cache: false
        })
        .always((response) => {
            response_helper.parse_json(response, function(error, response_is_json, response, error_message) {

                if(error && response_is_json)
                {
                    console.log(response_is_json);
                    console.log(response);
                    _this.error_callback(response, error_message);
                    return;
                }

                if(error || !response_is_json)
                {
                    _this.error_attempts++;
                    if(_this.error_attempts > _this.error_attempts_limit)
                    {
                        _this.error_callback(response, error_message);
                        return;
                    }

                    callback(response, true);

                    return;
                }

                _this.error_attempts = 0;

                callback(response, false);
            });
        });
    }

    setErrorCallback(error_callback)
    {
        this.error_callback = error_callback;

        return this;
    }

    setSuccessCallback(success_callback)
    {
        this.success_callback = success_callback;

        return this;
    }

    setProgressCallback(progress_callback)
    {
        this.progress_callback = progress_callback;

        return this;
    }
}

const $ = require('jquery');
const response_helper = require('./response.helper.js');

module.exports = ChunkUploadProcessAsync;