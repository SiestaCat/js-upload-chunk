class ChunkUploadRequest
{
    constructor(form, files)
    {
        this.success_callback = () => {};
        this.always_callback = () => {};
        this.error_callback = () => {};

        this.form = form;
        this.files = {};

        files.forEach((file) => {
            let file_id = cryptoRandomString({length: 16, type: 'alphanumeric'});
            file.file_id = file_id;
            this.files[file_id] = file;
        });
    }

    getFiles()
    {
        return this.files;
    }

    send(form_data)
    {

        let _this = this;

        $.ajax({
            url: this.form.getAttribute('action'), 
            type: this.form.getAttribute('method'),
            data: this.addFilesToFormData(form_data),
            dataType: 'json',
            processData: true,
            cache: false
        })
        .always((response) => {
            _this.always_callback(response);

            response_helper.parse_json(response, function(error, response_is_json, response, error_message) {
                if(error)
                {
                    _this.error_callback(response, error_message);
                    return;
                }

                if(!(response.hasOwnProperty('request_id') && response.request_id.length >= 8 && response.hasOwnProperty('parts') && Array.isArray(response.parts)))
                {
                    _this.error_callback(response);
                    return;
                }

                _this.success_callback(response.request_id, _this.files, response.parts);
            });
        });
    }

    addFilesToFormData(form_data)
    {

        let files_field = [];

        for (const file_id in this.files)
        {
            let file = this.files[file_id];
            files_field.push({'id' : file_id, 'name' : file.name, 'size' : file.size});
        }

        form_data['upload_chunk[files]'] = files_field;

        return form_data;
    }

    success(success_callback)
    {
        this.success_callback = success_callback;

        return this;
    }

    always(always_callback)
    {
        this.always_callback = always_callback;

        return this;
    }

    error(error_callback)
    {
        this.error_callback = error_callback;

        return this;
    }
}

const $ = require('jquery');
const response_helper = require('./response.helper.js');
const cryptoRandomString = require('crypto-random-string').default;

module.exports = ChunkUploadRequest;