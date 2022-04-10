export const settings = {
    defaultApiBaseUrl: 'https://mc.yuuza.net/api/',
    apiBaseUrl: '',
    debug: true,
    apiDebugDelay: 0,
    showDownloadOptions: false,
    showDiscussion: false,
    showNotes: false,

    init() {
        var server = localStorage.getItem('mcloud-server');
        this.apiBaseUrl = server || this.defaultApiBaseUrl;
    }
};
