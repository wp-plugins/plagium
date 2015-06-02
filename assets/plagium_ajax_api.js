/*
    Plagium Ajax API 1.0.2
    http://www.plagium.com
    (c) Septet Systems 2015
*/

var _plagium_url = "https://www.plagium.com";
var _plagium_ajax_url = "http://www.plagium.com/cfc/oplagiumapi.cfc";
var _plagium_ajax_url_secure = "http://www.plagium.com/cfc/oplagiumapi.cfc";

//_plagium_url = "http://plagium.localhost";
//_plagium_ajax_url = "http://plagium.localhost/cfc/oplagiumapi.cfc";
//_plagium_ajax_url_secure = "http://plagium.localhost/cfc/oplagiumapi.cfc";

var _collection_id = 0;
var _collection_current_page = 1;

function lastAjaxAction(action, pg, pr, st, vb, pos) {
    this.action = action;
    this.pg = pg;
    this.pr = pr;
    this.st = st;
    this.pos = pos;

    this.copy = function (a) {
        this.action = a.action;
        this.pg = a.pg;
        this.pr = a.pr;
        this.st = a.st;
        this.vb = a.vb;
        this.pos = a.pos;
    }
    this.cmp = function (a) {
        if (this.action != a.action) return false;
        if (this.pg != a.pg) return false;
        if (this.pr != a.pr) return false;
        if (this.st != a.st) return false;
        if (this.vb != a.vb) return false;
        if (this.pos != a.pos) return false;
        return true;
    }
    this.check = function (a) {
        if (this.cmp(a)) return false;
        this.copy(a);
        return true;
    }
}

var _last_ajax_action = new lastAjaxAction("", -1, -1, -1, -1, -1);

showLeftIndicator = function () {
    jQuery('.leftIndicator').show();
    jQuery('.rightIndicator').hide();
}

showRightIndicator = function () {
    jQuery('.leftIndicator').hide();
    jQuery('.rightIndicator').show();
}

hideIndicator = function () {
    jQuery('.leftIndicator').hide();
    jQuery('.rightIndicator').hide();
}

isCollectionUrl = function (url) {
    return (url.indexOf("file://") >= 0);
}

collectionUrl = function (url) {
    if (!isCollectionUrl(url)) return url;
    return "#";
}

jsURL = function (url) {
    return encodeURI(url);
}

formatRank = function (rank) {
    try {
        var r = parseFloat(rank);
        if (r >= 80.0) return "<span class='label label-important'>" + LOC.search8 + ': ' + r.toFixed(1) + "%</span>";
        if (r >= 50.0) return "<span class='label label-warning'>" + LOC.search8 + ': ' + r.toFixed(1) + "%</span>";
        if (r >= 20.0) return "<span class='label label-info'>" + LOC.search8 + ': ' + r.toFixed(1) + "%</span>";
        return "<span class='label label-inverse'>" + LOC.search8 + ': ' + r.toFixed(1) + "%</span>";
    }
    catch (e) {
        return "<span class='label'>" + LOC.search8 + ': ' + rank + "%</span>";
    }
}

formatStatus = function (check) {
    if (check == null) return "";
    switch (parseFloat(check)) {
        /*case 0: return "&nbsp;<span class='label'>"+LOC.file4+"</span>";*/ // unchecked
        case 1: return "&nbsp;<span class='label label-success'>" + LOC.file1 + "</span>";     // checked
        case 2: return "&nbsp;<span class='label label-warning'>" + LOC.file3 + "</span>";     // unavailable
    }
    return "";
}

initActionsOnQueries = function (pg) {
    jQuery('#leftColumn' + pg + ' .highlightQuery').mouseover(function () {
        jQuery('#leftColumn' + pg + ' .queryOpen').removeClass('queryOpen');
        jQuery(this).addClass('queryOpen');

        plagiumLoadPageDocumentsContainingQueries(jQuery(this).attr('pg'), jQuery(this).attr('pr'), jQuery(this).attr('st'), jQuery(this).attr('vb'));
    });

    jQuery('#leftColumn' + pg + ' .highlightQuery').click(function () {
        jQuery('#leftColumn' + pg + ' .queryOpen').removeClass('queryOpen');
        jQuery(this).addClass('queryOpen');

        plagiumLoadPageDocumentsContainingQueries(jQuery(this).attr('pg'), jQuery(this).attr('pr'), jQuery(this).attr('st'), jQuery(this).attr('vb'));
    });
}


initActionsOnResult = function (result) {
    jQuery(result).mouseover(function () {
        jQuery('#rightColumn' + jQuery(this).attr('page') + ' .highlight').removeClass('highlight');
        jQuery(this).addClass('highlight');
        plagiumLoadQueries(jQuery(this).attr('page'), jQuery(this).attr('pos'), jQuery(this).attr('rel'));
    });

    jQuery(result).click(function () {
        jQuery('#rightColumn' + jQuery(this).attr('page') + ' .highlight').removeClass('highlight');
        jQuery(this).addClass('highlight');
        plagiumLoadQueries(jQuery(this).attr('page'), jQuery(this).attr('pos'), jQuery(this).attr('rel'));
    });

    /*jQuery(result).mouseout(function(){
        jQuery('.queryOpen').removeClass('queryOpen');
    });*/
}


addDocumentToList = function (d) {
    //logMsg('addDocumentToList: '+ d.URL);

    var htmlResult = jQuery('<div></div>').addClass('result').addClass('resPage').attr('rel', d.URL).attr('page', d.PAGE).attr('pos', d.POS);
    var resTitle = jQuery('<span></span>').addClass('resTitle');
    var resLink = jQuery('<a></a>').addClass('resTitle');

    if (isCollectionUrl(d.URL))
        jQuery(resLink).addClass('resTitle').attr('href', collectionUrl(d.URL)).html(d.TITLE);
    else
        jQuery(resLink).addClass('resTitle').attr('href', d.URL).attr('target', '_blank').html(d.TITLE);

    jQuery(resTitle).append(resLink);

    jQuery(htmlResult).append(resTitle);

    var resInfo = jQuery('<div></div>').addClass('resInfo');

    if (d.SUMMARY.length > 150) d.SUMMARY = d.SUMMARY.substring(0, 150) + '...';

    jQuery(resInfo).append(jQuery('<span></span>').addClass('resTeaser').html(d.SUMMARY)).append('<br />');

    var engines = d.ENGINES;

    if (!isCollectionUrl(d.URL)) {
        var shorturl = d.URL;
        if (shorturl.length > 50) shorturl = shorturl.substring(0, 50) + '...';
        jQuery(resInfo).append('<span class="resURL">' + LOC.search3 + ': <a class="resURL" href="' + jsURL(d.URL) + '"style="text-decoration:none" target="_blank">' + shorturl + '</a></span><br />');
    }
    else {
        if (engines.length > 0) engines += ',';
        engines += 'Files';
    }

    jQuery(resInfo).append(jQuery('<span></span>').addClass('resDate')
                                            .append(' ' + LOC.result8 + ": " + engines + "&nbsp;-" + formatStatus(d.CHECK) + "&nbsp;" + formatRank(d.RANK)));

    jQuery(htmlResult).append(resInfo);

    return htmlResult;
}

plagiumLoadPageDocumentsCallBack = function (r) {
    var nb_documents = 0;
    var htmlResults = jQuery('<div></div>').addClass('miniResults');

    for (var pos in r.DOCUMENTS) {
        var d = r.DOCUMENTS[pos];

        var htmlResult = addDocumentToList(d);
        jQuery(htmlResults).append(htmlResult);

        initActionsOnResult(htmlResult);

        ++nb_documents;
    }
    jQuery('.rightColumn').html('');
    jQuery('#rightColumn' + r.PAGE).html('<div class="documentNumber">' + nb_documents + ' document(s) found on this page.</div>');
    jQuery('#rightColumn' + r.PAGE).append(htmlResults);
    jQuery('#rightColumn' + r.PAGE).append('<div id="fliplinks' + r.PAGE + '" current="' + r.PAGE + '"></div>');
    jQuery('#rightColumn' + r.PAGE).scrollTop(0);
}

plagiumLoadPageDocumentsContainingQueriesCallBack = function (r) {
    var nb_documents = 0;
    var htmlResults = jQuery('<div></div>').addClass('miniResults');

    for (var pos in r.DOCUMENTS) {
        var d = r.DOCUMENTS[pos];

        var htmlResult = addDocumentToList(d);
        jQuery(htmlResults).append(htmlResult);

        initActionsOnResult(htmlResult);

        ++nb_documents;
    }
    //jQuery('.rightColumn').html('');
    jQuery('#rightColumn' + r.PG).html('<div class="documentNumber">' + nb_documents + ' document(s) found on this sentence.<br /><a href="javascript:plagiumLoadPageDocuments();" style="text-decoration:underline"><i class="icon-refresh"></i> Back to all documents</a>.</div>');
    jQuery('#rightColumn' + r.PG).append(htmlResults);
    jQuery('#rightColumn' + r.PG).append('<div id="fliplinks' + r.PG + '" current="' + r.PG + '"></div>');
    jQuery('#rightColumn' + r.PG).scrollTop(0);
}


plagiumInvalidApiKey = function () {
    jQuery('#plagium_error').html('Invalid Plagium Account Information!.<br >Please, check your Plagium Plugin Settings <a href="/wp-admin/options-general.php?page=plagium-admin">here</a>.');
}

plagiumCheckVersion = function () {
    jQuery.ajax({
        url: _plagium_ajax_url,
        method: 'post',
        dataType: 'json',
        data: {
            method: 'checkVersion',
            version: jQuery('#plagium_version').val()
        }
    })
    .done(function (r) {
        if (r.ERROR.length == 0 || r.ERROR != 0) {
            jQuery('#plagium_message').html(r.ERROR_MSG);
            jQuery('#plagium_message').show();
            return;
        }
    });
}

plagiumGetApiKey = function () {
    jQuery('#plagium_settings_submit').attr("disabled", true);

    jQuery.ajax({
        url: _plagium_ajax_url_secure,
        method: 'post',
        dataType: 'json',
        data: {
            method: 'getApiKey',
            email: jQuery('#plagium_email').val(),
            password: jQuery('#plagium_password').val(),
            version: jQuery('#plagium_version').val()
        }
    })
    .done(function (r) {
        jQuery('#plagium_settings_submit').attr("disabled", false);

        if (r.ERROR.length==0 || r.ERROR != 0) {
            jQuery('#plagium_account_settings_error').text(r.ERROR_MSG);
            jQuery('#plagium_account_settings_error').show();
            return;
        }
        jQuery('#plagium_account_settings_error').hide();
        jQuery('#plagium_api_key').val(r.API_KEY);
        jQuery('#plagium_settings_form').submit();
    });
}

plagiumSearch = function (deepsearch) {
    jQuery('#plagium_quick_search').attr("disabled", true);
    jQuery('#plagium_deep_search').attr("disabled", true);

    var source = jQuery("input[name=plagium_source]:checked").val();

    jQuery.ajax({
        url: _plagium_ajax_url,
        method: 'post',
        dataType: 'json',
        data: {
            method: 'search',
            api_key: jQuery('#plagium_api_key').val(),
            version: jQuery('#plagium_version').val(),
            deepsearch: deepsearch,
            source: source,
            exclude_domains: jQuery('#plagium_exclude_domains').val(),
            import_id: jQuery('#post_ID').val(),
            url: window.location.href,
            title: jQuery('#title').val(),
            content: jQuery('#content').val()
        }
    })
    .done(function (r) {
        jQuery('#plagium_quick_search').attr("disabled", false);
        jQuery('#plagium_deep_search').attr("disabled", false);
        if (r.ERROR.length == 0 || r.ERROR != 0) {
            if (r.ERROR == 1) plagiumInvalidApiKey();
            else jQuery('#plagium_error').text(r.ERROR_MSG);
            jQuery('#plagium_error').show();
            return;
        }
        jQuery('#plagium_error').hide();
        plagiumLoad();
    });
}

plagiumLoad = function () {
    jQuery.ajax({
        url: _plagium_ajax_url,
        method: 'post',
        dataType: 'json',
        data: {
            method: 'load',
            api_key: jQuery('#plagium_api_key').val(),
            version: jQuery('#plagium_version').val(),
            import_id: jQuery('#post_ID').val()
        }
    })
    .done(function (r) {
        _collection_id = 0;
        if (r.ERROR.length == 0 || r.ERROR != 0) {
            if (r.ERROR == 1) plagiumInvalidApiKey();
            else jQuery('#plagium_error').text(r.ERROR_MSG);
            jQuery('#plagium_error').show();
            jQuery('#plagium_content').html('');

            return;
        }
        jQuery('#plagium_error').hide();
        jQuery('#plagium_content').html(r.CONTENT);

        _collection_id = r.ID;

        if (r.NEXTACTION == 'load') {
            setTimeout(function () {
                plagiumLoad();
            }, r.NEXTACTIONTIME);
            return;
        }
        if (r.NEXTACTION == 'loadPage') {
            setTimeout(function () {
                plagiumLoadPage();
            }, r.NEXTACTIONTIME);
            setTimeout(function () {
                plagiumLoadPageDocuments();
            }, r.NEXTACTIONTIME);
            return;
        }
    });
}

plagiumLoadPage = function () {
    _last_ajax_action.check(new lastAjaxAction("loadPage", _collection_current_page, -1, -1, -1, -1));
    jQuery.ajax({
        url: _plagium_ajax_url,
        method: 'post',
        dataType: 'json',
        data: {
            method: 'loadPage',
            api_key: jQuery('#plagium_api_key').val(),
            id: _collection_id,
            page: _collection_current_page
        }
    })
    .done(function (r) {
        if (r.ERROR.length == 0 || r.ERROR != 0) {
            jQuery('#leftColumn'+r.PAGE).html(r.ERROR_MSG);
            return;
        }
        jQuery('#leftColumn' + r.PAGE).html(r.CONTENT);

        if (r.QUERIES.length > 0) {
            console.log(r.QUERIES.length);
            for (var pos in r.QUERIES) {
                var q = r.QUERIES[pos];
                jQuery('#leftColumn' + q.PG + ' .query[pg="' + q.PG + '"][pr="' + q.PR + '"][st="' + q.ST + '"][vb="' + q.VB + '"]').addClass('highlightQuery');
            }
            initActionsOnQueries(r.PAGE);
        }

        jQuery('#leftColumn' + r.PAGE).append('<div id="flipqueries' + r.PAGE + '" current="' + r.PAGE + '"></div>');
    });
}

plagiumLoadPageDocuments = function () {
    _last_ajax_action.check(new lastAjaxAction("loadPageDocuments", _collection_current_page, -1, -1, -1, -1));
    showRightIndicator();
    jQuery.ajax({
        url: _plagium_ajax_url,
        method: 'post',
        dataType: 'json',
        data: {
            method: 'loadPageDocuments',
            api_key: jQuery('#plagium_api_key').val(),
            id: _collection_id,
            page: _collection_current_page
        }
    })
    .done(function (r) {
        hideIndicator();
        if (r.ERROR.length == 0 || r.ERROR != 0) {
            jQuery('#rightColumn' + r.PAGE).html(r.ERROR_MSG);
            return;
        }
        plagiumLoadPageDocumentsCallBack(r);
    });
}

plagiumLoadPageDocumentsContainingQueries = function (pg, pr, st, vb) {
    if (!_last_ajax_action.check(new lastAjaxAction("loadPageDocumentsContainingQueries", pg, pr, st, vb, -1))) return;
    showRightIndicator();
    jQuery.ajax({
        url: _plagium_ajax_url,
        method: 'post',
        dataType: 'json',
        data: {
            method: 'loadPageDocumentsContainingQueries',
            api_key: jQuery('#plagium_api_key').val(),
            id: _collection_id,
            pg: pg,
            pr: pr,
            st: st,
            vb: vb
        }
    })
    .done(function (r) {
        hideIndicator();
        if (r.ERROR.length == 0 || r.ERROR != 0) {
            jQuery('#rightColumn' + r.PAGE).html(r.ERROR_MSG);
            return;
        }
        plagiumLoadPageDocumentsContainingQueriesCallBack(r);
    });
}

plagiumLoadQueries = function (pg, pos, url) {
    if (!_last_ajax_action.check(new lastAjaxAction("loadQueries", pg, -1, -1, -1, pos))) return;
    showLeftIndicator();
    jQuery.ajax({
        url: _plagium_ajax_url,
        method: 'post',
        dataType: 'json',
        data: {
            method: 'loadQueries',
            api_key: jQuery('#plagium_api_key').val(),
            id: _collection_id,
            pg: pg,
            pos: pos,
            url: url
        }
    })
    .done(function (r) {
        hideIndicator();
        if (r.ERROR.length == 0 || r.ERROR != 0) {
            return;
        }
        jQuery('.queryOpen').removeClass('queryOpen');

        if (r.QUERIES.length > 0) {
            for (var pos in r.QUERIES) {
                var q = r.QUERIES[pos];
                jQuery('#leftColumn' + q.PG + ' .highlightQuery[pg="' + q.PG + '"][pr="' + q.PR + '"][st="' + q.ST + '"][vb="' + q.VB + '"]').addClass('queryOpen');
            }
        }
    });
}

jQuery(document).ready(function () {
    // settings page
    jQuery('#plagium_settings_submit').click(function () {
        console.log('plagium_settings_submit click');
        plagiumGetApiKey();
    });

    // post page
    jQuery('#plagium_quick_search').click(function () {
        console.log('plagium_quick_search click');
        plagiumSearch(0);
    });

    jQuery('#plagium_deep_search').click(function () {
        console.log('plagium_deep_search click');
        plagiumSearch(1);
    });

    if (jQuery('#plagium_container').length > 0) {
        plagiumLoad();
    }

    plagiumCheckVersion();
});

