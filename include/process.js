class ChunkUploadProcess
{

    success_callback = () => {};

    progress_callback = () => {};

    error_callback = () => {};

    stop = false;

    last_response = null;

    constructor(url, request_id, files)
    {
        this.url = url;
        this.request_id = request_id;
        this.files = Object.values(files);
        this.files_count = this.files.length;
    }

    process()
    {
        let _this = this;

        if(this.stop) return;

        let percent = this.files.length === 0 ? 100 : Math.abs(((this.files.length / this.files_count) * 100) - 100);

        this.progress_callback(percent);

        if(this.files.length === 0) return this.success_callback(this.last_response);
        if(this.files.length > 0) this.processFile(this.files[0].file_id, () => {_this.files.shift();_this.process();});
    }

    

    processFile(file_id, callback)
    {
        let _this = this;

        let form_data = {
            'request_id' : this.request_id,
            'file_id' : file_id
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
                if(error || !response_is_json)
                {
                    _this.stop = true;
                    _this.error_callback(response, error_message);
                    return;
                }

                _this.last_response = response;

                callback(response);
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

module.exports = ChunkUploadProcess;