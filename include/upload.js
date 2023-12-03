class ChunkUpload
{
    max_attempts = 10;

    files = {};

    parts = {};

    stop = false;

    stop_callback = () => {};

    success_callback = () => {};

    progress_callback = () => {};

    size = 0;

    size_uploaded = 0;

    constructor(url, request_id, files, parts, concurrent_upload = 2)
    {

        this.url = url;

        this.concurrent_upload = concurrent_upload;

        this.request_id = request_id;

        for (const [file_id, file] of Object.entries(files))
        {
            //Add new properties to file object
            file.uploaded = false;
            file.parts_uploaded = 0;
            file.parts_count = 0;
            this.files[file_id] = file;
        }

        parts.forEach((part) => {
            //Increase parts count
            this.files[part.file_id].parts_count++;
            //Add new properties to part object
            part.attempts = 0;
            part.is_done = false;
            part.part_id = part.file_id + "_" + part.index;
            //Add part size to size property
            this.size += part.size;

            //Append part object
            this.parts[part.part_id] = part;
        });
    }

    call_progress_callback(_this = null)
    {
        _this = _this === null ? this : _this;

        let percent = (_this.size_uploaded / this.size) * 100;

        _this.progress_callback(percent);
    }

    upload()
    {

        let _this = this;

        (async () => {
            let parts_to_send = [];
            for (const [part_id, part]  of Object.entries(_this.parts))
            {
                if(part.is_done) continue;
                if(parts_to_send.length >= _this.concurrent_upload) break;
                parts_to_send.push(part);
            }
            if(parts_to_send.length > 0)
            {
                await _this.promiseUploadParts(parts_to_send, _this);
                _this.upload();
            }

            if(parts_to_send.length === 0) _this.success_callback();
        })();
    }

    /**
     * @param {Array} parts_to_send 
     * @param {this} _this 
     */
    promiseUploadParts(parts_to_send, _this)
    {
        return new Promise((resolve) => {

            let finished_count = 0;

            parts_to_send.forEach(function(part) {
                _this.promiseUploadPart(part, _this, function() {
                    _this.size_uploaded += part.size;
                    _this.call_progress_callback(_this);
                    finished_count++;
                    _this.parts[part.part_id].is_done = true;
                    if(finished_count >= parts_to_send.length) resolve();
                });
            });

        });
    }

    /**
     * @param {object} part 
     * @param {this} _this 
     */
    promiseUploadPart(part, _this, part_success_callback)
    {

        let stop_callback = (error_message) => {
            _this.stop_callback(error_message);
            _this.stop = true;
        }

        _this.uploadPart(part, function(success = true, stop = false, error_message = null) {
            if(success) return part_success_callback();
            if(stop) return stop_callback(error_message);

            _this.parts[part.part_id].attempts++;

            let attempts = _this.parts[part.part_id].attempts;

            if(attempts > _this.max_attempts)
            {
                return stop_callback(error_message === null ? 'max_attempts' : error_message);
            }

            setTimeout(() => {_this.promiseUploadPart(part, _this, part_success_callback)}, 500);
        });
    }

    uploadPart(part, always_callback)
    {
        if(this.stop) return;

        let _this = this;

        let file = this.files[part.file_id];

        let formData = new FormData();

        formData.append('request_id', this.request_id);
        formData.append('file', file.slice(part.start, part.end), file.name);
        formData.append('file_id', part.file_id);
        formData.append('part_index', part.index);

        $.ajax({
            url: this.url, 
            type: 'POST',
            data: formData,
            cache: false,
            contentType: false,
            processData: false
        })
        .always((response) => {
            response_helper.parse_json(response, function(error, response_is_json, response, error_message) {
                if(error && response_is_json && response.hasOwnProperty('stop') && response.stop === true)
                {
                    return always_callback(false, true, error_message);
                }

                if(error) return always_callback(false, false, error_message);

                always_callback();
            });
        });
    }

    setStopCallback(stop_callback)
    {
        this.stop_callback = stop_callback;

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
module.exports = ChunkUpload;