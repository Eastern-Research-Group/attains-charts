var legacyDataSource = '../tmdlsfy.csv';
var newDataSource = '../tmdls.csv';
var dataSource = newDataSource;
var legacy = 'N';
var dataDownloadDate = '';

var selectedFy = '';
var selectedRegions = '';
var selectedStates = [];
var selectedPollGrps = [];

var filteredFys = {};
var filteredRegions = [];
var filteredStates = [];
var filteredPollGrps = [];

var filterFyString = '';

var pickerFys = {};
// var pickerRegions = [];
var pickerStates = [];
var pickerPollGrps = [];

var absoluteFys = {};
var absoluteStates = [];
var absolutePollGrps = [];

var combinedTitle = 'TMDL Production History ';
var fyTitle = 'Annual TMDLs ';
var stateTitle = 'TMDLs by State ';
var pollgrpTitle = 'TMDLs by Pollutant Group ';

var finalCombinedTitle = '';
var finalFyTitle = '';
var finalStateTitle = '';
var finalPollGrpTitle = '';

var stateChartHeight = 1500;

var stateNamesDict = {
    AK: 'Alaska',
    AL: 'Alabama',
    AR: 'Arkansas',
    AS: 'American Samoa',
    AZ: 'Arizona',
    CA: 'California',
    CO: 'Colorado',
    CT: 'Connecticut',
    DC: 'District of Columbia',
    DE: 'Delaware',
    FL: 'Florida',
    GA: 'Georgia',
    GU: 'Guam',
    HI: 'Hawaii',
    IA: 'Iowa',
    ID: 'Idaho',
    IL: 'Illinois',
    IN: 'Indiana',
    KS: 'Kansas',
    KY: 'Kentucky',
    LA: 'Louisiana',
    MA: 'Massachusetts',
    MD: 'Maryland',
    ME: 'Maine',
    MI: 'Michigan',
    MN: 'Minnesota',
    MO: 'Missouri',
    MP: 'Northern Mariana Islands',
    MS: 'Mississippi',
    MT: 'Montana',
    NC: 'North Carolina',
    ND: 'North Dakota',
    NE: 'Nebraska',
    NH: 'New Hampshire',
    NJ: 'New Jersey',
    NM: 'New Mexico',
    NV: 'Nevada',
    NY: 'New York',
    OH: 'Ohio',
    OK: 'Oklahoma',
    OR: 'Oregon',
    PA: 'Pennsylvania',
    PR: 'Puerto Rico',
    RI: 'Rhode Island',
    SC: 'South Carolina',
    SD: 'South Dakota',
    TN: 'Tennessee',
    TX: 'Texas',
    UT: 'Utah',
    VA: 'Virginia',
    VI: 'US Virgin Islands',
    VT: 'Vermont',
    WA: 'Washington',
    WI: 'Wisconsin',
    WV: 'West Virginia',
    WY: 'Wyoming'
};

var colorPallette = [ '#FF6633', '#FFB399', '#FF33FF', '#FFFF99', '#00B3E6',
                      '#E6B333', '#3366E6', '#999966', '#99FF99', '#B34D4D',
                      '#80B300', '#809900', '#E6B3B3', '#6680B3', '#66991A',
                      '#FF99E6', '#CCFF1A', '#FF1A66', '#E6331A', '#33FFCC',
                      '#66994D', '#B366CC', '#4D8000', '#B33300', '#CC80CC',
                      '#66664D', '#991AFF', '#E666FF', '#4DB3FF', '#1AB399',
                      '#E666B3', '#33991A', '#CC9999', '#B3B31A', '#00E680',
                      '#4D8066', '#809980', '#E6FF80', '#1AFF33', '#999933',
                      '#FF3380', '#CCCC00', '#66E64D', '#4D80CC', '#9900B3',
                      '#E64D66', '#4DB380', '#FF4D4D', '#99E6E6', '#6666FF'];

function autocase(text) {
    return text.replace(/(&)?([a-z])([a-z]{2,})(;)?/ig,function ( all, prefix, letter, word, suffix ) {
        if (prefix && suffix) {
            return all;
        }
        return letter.toUpperCase() + word.toLowerCase();
    });
}

function getUrlVars() {
    var vars = {};
    var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
        vars[key] = value;
    });
    return vars;
}

function getUrlParam(parameter, defaultvalue){
    var urlparameter = defaultvalue;
    if(window.location.href.indexOf(parameter) > -1){
        urlparameter = getUrlVars()[parameter];
        }
    return urlparameter;
}


function initialize() {
    var queryOptions = {
        //            0-fy     1-region  2-state  3-poll grp  4-poll   5-num     6-cumulative
        csvColumns: ['number', 'number', 'string', 'string', 'string', 'number', 'number'],
        csvHasHeader: true
    };
    var query = new google.visualization.Query(dataSource, queryOptions);
    query.send(handleQueryResponse);
}

function handleQueryResponse(response) {
    if (response.isError()) {
        alert('Error in query: ' + response.getMessage() + ' ' + response.getDetailedMessage());
        return;
    }
    var data = response.getDataTable();
    // initcap pollutant groups for non-legacy data
    // only need to do this if getting parameter groups from web service;
    // if finding manually, comment out
    // if (legacy !== 'Y') {
    //     for (var i = 0, length = data.getNumberOfRows(), value; i < length; i++) {
    //         value = data.getValue(i, 3);
    //         data.setValue(i, 3, autocase(value));
    //         // value = data.getValue(i, 4);
    //         // data.setValue(i, 4, autocase(value));
    //     }
    // }
    // set the absolute min and max FYs for use later in constructing FY portion of chart titles
    absoluteFys.min = data.getColumnRange(0).min;
    absoluteFys.max = data.getColumnRange(0).max;
    // console.log('absoluteFys min and max = ' + absoluteFys.min + ' and ' + absoluteFys.max);
    // save array of all states for use later in construction state portion of chart titles
    absoluteStates = data.getDistinctValues(2);
    // console.log('absoluteStates = ' + absoluteStates);
    // save array of all pollutant groups for use later in construction pollutant group portion of chart titles
    absolutePollGrps = data.getDistinctValues(3);
    // console.log('absolutePollGrps = ' + absolutePollGrps);
    drawDashboard(data);
}

function getTotal(data, column) {
    var total = 0;
    for (i = 0; i < data.getNumberOfRows(); i++)
      total = total + data.getValue(i, column);
    return total;
  }

function getStateName(stateCode) {
    return stateNamesDict[stateCode];
}

function formatInteger(num) {
  return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')
}

function getPercent(value, total) {
    return ((value/total) * 100).toFixed(1) + '%';
}

function customTooltip(name, value, total) {
    return name + '<br/><strong>' + formatInteger(value) + ' (' + ((value/total) * 100).toFixed(1) + '%)</strong>';
}

function customLegend(name, value, total) {
    return name + ': ' + formatInteger(value) + ' TMDLs (' + ((value/total) * 100).toFixed(1) + '%)';
}

function openBase64InNewTab (data, mimeType) {
    var byteCharacters = atob(data.replace(/^data:image\/(png|jpeg|jpg);base64,/, ''));
    // var byteCharacters = atob(data);
    var byteNumbers = new Array(byteCharacters.length);
    for (var i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    var byteArray = new Uint8Array(byteNumbers);
    var file = new Blob([byteArray], { type: mimeType + ';base64' });
    var fileURL = URL.createObjectURL(file);
    window.open(fileURL);
}

function debugBase64(base64URL){
    var win = window.open();
    win.document.write('<iframe src="' + base64URL  + '" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>');
}

function openPrinterFriendly(url) {
    var newTab = window.open();
    newTab.document.body.innerHTML = '<img src="' + url + '" width="100px" height="100px">';
}

function drawDashboard(data) {
    // update the downloadDate div text if using legacy ATTAINS dataSource
    if (legacy === 'Y') {
        document.getElementById('downloadDate').innerHTML = 'Data in these charts is static and were downloaded from the legacy ATTAINS system.'
    }

    var yrFormat = '####';
    var yrFormatter = new google.visualization.NumberFormat({ pattern: yrFormat });
    yrFormatter.format(data, 0);
    var collator = new Intl.Collator(undefined, {numeric: true, sensitivity: 'base'});

    var dashboard = new google.visualization.Dashboard(document.getElementById('dashboard_div'));

    var fySlider = new google.visualization.ControlWrapper({
      'controlType': 'NumberRangeFilter',
      'containerId': 'fy_filter',
      'options': {
        'filterColumnLabel': 'FiscalYear',
        'ui': {
          'label': 'Fiscal Year',
          'format': { 'pattern': '####'}
        }
      }
    });
    google.visualization.events.addListener(fySlider, 'statechange', function () {
        pickerFys.min = fySlider.getState().lowValue;
        pickerFys.max = fySlider.getState().highValue;
        // console.log(fySlider.getState().lowValue);
    });

    var regionPicker = new google.visualization.ControlWrapper({
      'controlType': 'CategoryFilter',
      'containerId': 'region_filter',
      'options': {
          'values': ['1','2','3','4','5','6','7','8','9','10'],
          'filterColumnLabel': 'Region',
          'ui': {
            'allowTyping': true,
            'allowMultiple': true,
            'sortValues': false
          }
       }
    });
    google.visualization.events.addListener(regionPicker, 'statechange', function () {
        // pickerRegions = regionPicker.getState().selectedValues;
        selectedRegions = regionPicker.getState().selectedValues.sort(collator.compare).join(', ');
        if (regionPicker.getState().selectedValues.length > 0) {
            if (regionPicker.getState().selectedValues.length > 1) {
                selectedRegions = 'Regions ' + selectedRegions;
            }
            else {
                selectedRegions = 'Region ' + selectedRegions;
            }
        }
        // console.log(selectedRegions);
    });

    var statePicker = new google.visualization.ControlWrapper({
      'controlType': 'CategoryFilter',
      'containerId': 'state_filter',
      'options': {
          'filterColumnLabel': 'State',
          'ui': {
              'allowTyping': true,
              'allowMultiple': true
                }
            }
    });
    google.visualization.events.addListener(statePicker, 'statechange', function () {
        pickerStates = statePicker.getState().selectedValues;
        // console.log('statePicker listener pickerStates = ' + pickerStates);
    });

    pollgrpPicker = new google.visualization.ControlWrapper({
      'controlType': 'CategoryFilter',
      'containerId': 'pollgrp_filter',
      'options': {
          'filterColumnLabel': 'PollutantGroup',
          'ui': {
              'label': 'Pollutant Group',
              'allowTyping': true,
              'allowMultiple': true
                }
            }
    });
    google.visualization.events.addListener(pollgrpPicker, 'statechange', function () {
        // selectedPollGrps = pollgrpPicker.getState().selectedValues.sort(collator.compare).join(', ');
        pickerPollGrps = pollgrpPicker.getState().selectedValues;
        // console.log('pollgrpPicker listener pickerStates = ' + pickerPollGrps);
    });

    // this is the hidden chart table that contains data fitting all filters
    // needed to make all charts interact with the filters on the dashboard
    proxyTable = new google.visualization.ChartWrapper({
        chartType: 'Table',
        containerId: 'proxyTable',
        options: {
            // minimize the footprint of the table in HTML
            page: 'enable',
            pageSize: 1
        },
        view: {
            columns: [0]
        }
    });

    combinedChart = new google.visualization.ChartWrapper({
        'chartType': 'AreaChart',
        'containerId': 'combined_chart',
        'options': {
            'title': finalCombinedTitle,
            'titleTextStyle': {'color': 'black'},
            'theme': 'material',
            'hAxis': {
                'format': '####',
                'textStyle': {'color': 'black'},
                'gridlines': { 'count': -1}
            },
            'vAxis': {
                'format': '#,###',
                'textStyle': {'color': 'black'},
                'gridlines': { 'count': -1}, //this line and the one below force integers on axis
                'minValue': 0,
                'maxValue': 4
            },
            'width': 800,
            'height': 300,
            'areaOpacity': 1.0,
            'colors': ['#eb770c','blue'],
            'legend': {'position': 'bottom'},
            'chartArea:': {'top': 40}
         },
        'view': {'columns': [0, 1, 2]}
      });

    fyChart = new google.visualization.ChartWrapper({
        'chartType': 'ColumnChart',
        'containerId': 'fy_chart',
        'options': {
            'title': fyTitle,
            'titleTextStyle': {'color': 'black'},
            'theme': 'material',
            'hAxis': {
                'format': '####',
                'textStyle': {'color': 'black'},
                'gridlines': { 'count': -1}
            },
            'vAxis': {
                'format': '#,###',
                'textStyle': {'color': 'black'},
                'gridlines': { 'count': -1}, //this line and the two below force integers on axis
                'minValue': 0,
                'maxValue': 4
            },
            'width': 800,
            'height': 300,
            'legend': {'position': 'none'},
            'chartArea:': {'top': 40}
         },
        'view': {'columns': [0, 1]}
      });

     if (stateChartHeight == null) {
         stateChartHeight = 1500;
     }
     stateChart = new google.visualization.ChartWrapper({
        'chartType': 'BarChart',
        'containerId': 'state_chart',
        'options': {
            'title': finalStateTitle,
            'titleTextStyle': {'color': 'black'},
            'theme': 'material',
            'colors': ['green'],
            'hAxis': {
                'format': '#,###',
                'textStyle': {'color': 'black'},
                'gridlines': { 'count': -1}, //this line and the two below force integers on axis
                'minValue': 0,
                'maxValue': 4
            },
            'vAxis': {'textStyle': {'color': 'black'}},
            'width': 750,
            'height': stateChartHeight,
            'legend': {'position': 'none'},
            'chartArea': {'left': 140,'top': 40}
         },
        'view': {'columns': [0, 1]}
      });

     pollgrpChart = new google.visualization.ChartWrapper({
        'chartType': 'PieChart',
        'containerId': 'pollgrp_chart',
        'options': {
            'title': finalPollGrpTitle,
            'titleTextStyle': {'color': 'black'},
            'pieSliceTextStyle': {'color': 'black'},
            'theme': 'material',
            'colors': colorPallette,
            'pieSliceText': 'label',
            'tooltip': {'isHtml': true},
            'width': 400,
            'height': 400,
            'legend': {'position': 'none'},
            'chartArea': {'top': 40}
        }
      });

    google.visualization.events.addListener(proxyTable, 'ready', function () {
        var dt = proxyTable.getDataTable();

        var combinedGroup = google.visualization.data.group(dt, [0], [
            {column: 6,
            type: 'number',
            label: 'Cumulative TMDLs',
            aggregation: google.visualization.data.sum},
            {column: 5,
            type: 'number',
            label: 'Annual TMDLs',
            aggregation: google.visualization.data.sum}
        ]);
        yrFormatter.format(combinedGroup, 0);
        combinedChart.setDataTable(combinedGroup);

        google.visualization.events.addListener(combinedChart, 'select', function() {
            var selectedItem = combinedChart.getChart().getSelection()[0];
            if (selectedItem) {
                selectedFy = combinedChart.getDataTable().getValue(selectedItem.row, 0);
            }
            fySlider.setState({'lowValue': selectedFy, 'highValue': selectedFy});
            fySlider.draw();
            pickerFys.min = selectedFy;
            pickerFys.max = selectedFy;
        });

        // var combined_chart = document.getElementById('combined_chart');
        // google.visualization.events.addListener(combinedChart, 'ready', function () {
        //     var pngUrl = combinedChart.getChart().getImageURI();
        //     // console.log(pngUrl);
        //     document.getElementById('combined_png').outerHTML = '<a href="' + pngUrl + '">Printable version</a>';
        //     // document.getElementById('combined_png').outerHTML = '<a href="' + openBase64InNewTab(pngUrl, 'image/png') + '">Printable version</a>';
        //     // document.getElementById('combined_png').outerHTML = '<a href="' + openPrinterFriendly(combinedChart.getChart().getImageURI()) + '">Printable version</a>';
        //     // document.getElementById('combined_png').outerHTML = '<a href="' + debugBase64(combinedChart.getChart().getImageURI()) + '">Printable version</a>';
        // });

        var fyGroup = google.visualization.data.group(dt, [0], [{
            column: 5,
            type: 'number',
            label: 'Number of TMDLs',
            aggregation: google.visualization.data.sum
        }]);
        yrFormatter.format(fyGroup, 0);
        fyChart.setDataTable(fyGroup);
        var view = new google.visualization.DataView(fyGroup);
        var displayedFys = view.getColumnRange(0);
        // get minimum and maximum FYs from the Annual TMDLs chart
        var minFy = displayedFys.min;
        var maxFy = displayedFys.max;
        // set minimum FY to minumum FY in chart
        if (pickerFys.min < minFy || !filteredFys.min) {
            filteredFys.min = minFy;
        }
        else {
            filteredFys.min = pickerFys.min;
        }
        // set maximum FY to maximum FY in chart
        if (pickerFys.max > maxFy || !filteredFys.max) {
            filteredFys.max = maxFy;
        }
        else {
            filteredFys.max = pickerFys.max;
        }
        // console.log('filteredFys min and max = ' + filteredFys.min + ' and ' + filteredFys.max);
        // console.log('absoluteFys min and max = ' + absoluteFys.min + ' and ' + absoluteFys.max);
        // console.log('pickerFys min and max = ' + pickerFys.min + ' and ' + pickerFys.max);
        if (filteredFys.min === filteredFys.max) {
            filterFyString = filteredFys.min;
        }
        else if (filteredFys.min === absoluteFys.min && filteredFys.max === absoluteFys.max) {
            // don't show FY range if it hasn't been filtered
            // console.log('no dates chosen');
            filterFyString = '';
        }
        else if (!pickerFys.min && !pickerFys.max) {
            // console.log('no dates selected on picker');
            filterFyString = '';
        }
        else
        {
            filterFyString = filteredFys.min + ' - ' + filteredFys.max;
        }
        // console.log('under fyGroup, filterFyString = ' + filterFyString);
        google.visualization.events.addListener(fyChart, 'select', function() {
            var selectedItem = fyChart.getChart().getSelection()[0];
            // console.log('fyChart.getDataTable().getValue(selectedItem.row, 0) = ' + fyChart.getDataTable().getValue(selectedItem.row, 0));
            if (selectedItem) {
                selectedFy = fyChart.getDataTable().getValue(selectedItem.row, 0);
            }
            fySlider.setState({'lowValue': selectedFy, 'highValue': selectedFy});
            fySlider.draw();
            pickerFys.min = selectedFy;
            pickerFys.max = selectedFy;
        });


        var stateGroup = google.visualization.data.group(dt, [2], [{
            column: 5,
            type: 'number',
            label: 'Number of TMDLs',
            aggregation: google.visualization.data.sum
        }]);
        stateChart.setDataTable(stateGroup);
        var stateView = new google.visualization.DataView(stateGroup);
        var displayedStates = stateView.getDistinctValues(0);
        filteredStates = [];
        // console.log('under stateGroup, pickerStates = ' + pickerStates);
        // console.log('under stateGroup, absoluteStates = ' + absoluteStates);
        // console.log('under stateGroup, displayedStates = ' + displayedStates);
        // if all states are being displayed, we don't want to include them in the chart title
        if (displayedStates.length !== absoluteStates.length) {
            for (i = 0; i < pickerStates.length; i++) {
                // console.log('looking for ' + pickerStates[i]);
                if (displayedStates.includes(pickerStates[i])) {
                    filteredStates.push(pickerStates[i]);
                }
            }
        }
        switch (true) {
            case (displayedStates.length >= 50):
                stateChartHeight = 1650;
                break;
            case (displayedStates.length > 40):
                stateChartHeight = displayedStates.length * 30;
                break;
            case (displayedStates.length > 30):
                stateChartHeight = displayedStates.length * 40;
                break;
            case (displayedStates.length > 20):
                stateChartHeight = displayedStates.length * 45;
                break;
            case (displayedStates.length > 10):
                stateChartHeight = displayedStates.length * 60;
                break;
            default:
                stateChartHeight = displayedStates.length * 70;
        }
        // console.log('States displayed = ' + displayedStates.length + '; height = ' + stateChartHeight);
        // console.log('under stateGroup, filteredStates = ' + filteredStates);

        // filter dashboard based on state bar click
        google.visualization.events.addListener(stateChart, 'select', function() {
            var selectedItem = stateChart.getChart().getSelection()[0];
            if (selectedItem) {
                selectedStates = stateChart.getDataTable().getValue(selectedItem.row, 0);
            }
            statePicker.setState({'selectedValues': [selectedStates]});
            pickerStates = [selectedStates];
            // console.log('under stateChart select listener, selectedStates = ' + selectedStates);
            statePicker.draw();
        });

        var chartContainer = document.getElementById('state_chart');
        google.visualization.events.addListener(stateChart, 'ready', function () {
            var labels = chartContainer.getElementsByTagName('text');
            Array.prototype.forEach.call(labels, function(label) {
                if ((label.getAttribute('text-anchor') === 'end') && (label.innerHTML.length === 2))  {
                  // console.log(label.innerHTML)
                  label.innerHTML = getStateName(label.innerHTML);
                  // label.classList.add('tooltip');
                  // var tooltiptext = '<span class="tooltiptext">' + getStateCode(label.innerHTML) + '</span>';
                  // console.log(tooltiptext);
                  // label.insertAdjacentHTML('beforeEnd', tooltiptext);
                }
            })
        });

        var pollgrpGroup = google.visualization.data.group(dt, [3], [{
            column: 5,
            type: 'number',
            label: 'Number of TMDLs',
            aggregation: google.visualization.data.sum
        }]);
        // add columns for the legend and tooltip
        var total = getTotal(pollgrpGroup, 1);
        // console.log('total = ' + total );
        // pollgrpGroup.addColumn('string', 'Percent')
        pollgrpGroup.addColumn({'type': 'string', 'label': 'Tooltip', 'role': 'tooltip'});
        pollgrpGroup.addColumn('string', 'Legend');
        for (i = 0; i < pollgrpGroup.getNumberOfRows(); i++) {
                // var percent = getPercent(pollgrpGroup.getValue(i, 1), total)
                var legend = customLegend(pollgrpGroup.getValue(i, 0), pollgrpGroup.getValue(i, 1), total);
                var tooltip = customTooltip(pollgrpGroup.getValue(i, 0), pollgrpGroup.getValue(i, 1), total);
                // console.log(tooltip);
                pollgrpGroup.setCell(i, 3, legend);
                pollgrpGroup.setCell(i, 2, tooltip);
            }
        pollgrpGroup.setColumnProperty(2, 'role', 'tooltip');
        pollgrpGroup.setColumnProperty(2, 'html', true);
        pollgrpChart.setDataTable(pollgrpGroup);

        // pollgrpChart.setDataTable(pollgrpGroup);
        var pollgrpView = new google.visualization.DataView(pollgrpGroup);
        var displayedPollgrps = pollgrpView.getDistinctValues(0);
        filteredPollGrps = [];
        // console.log('under pollgrpGroup, pickerPollGrps = ' + pickerPollGrps);
        // console.log('under pollgrpGroup, absolutePollGrps = ' + absolutePollGrps);
        // console.log('under pollgrpGroup, displayedPollgrps = ' + displayedPollgrps);
        // don't add pollutant groups to chart title if all pollutants are selected
        // console.log('displayedPollgrps.length = ' + displayedPollgrps.length + ', absolutePollGrps.length = ' + absolutePollGrps.length);
        if (displayedPollgrps.length !== absolutePollGrps.length) {
            // console.log('pickerPollGrps = ' + pickerPollGrps);
            for (i = 0; i < pickerPollGrps.length; i++) {
                // console.log('looking for ' + pickerPollGrps[i]);
                if (displayedPollgrps.includes(pickerPollGrps[i])) {
                    // console.log('found ' + pickerPollGrps[i]);
                    filteredPollGrps.push(pickerPollGrps[i]);
                }
            }
        }
        // console.log('under pollgrpGroup, filteredPollGrps = ' + filteredPollGrps);

        // filter dashboard based on pie chart click
        google.visualization.events.addListener(pollgrpChart, 'select', function() {
            var selectedItem = pollgrpChart.getChart().getSelection()[0];
            if (selectedItem) {
                selectedPollGrps = pollgrpChart.getDataTable().getValue(selectedItem.row, 0);
            }
            pollgrpPicker.setState({'selectedValues': [selectedPollGrps]});
            pickerPollGrps = [selectedPollGrps];
            // console.log('under pollgrpChart select listener, selectedPollGrps = ' + selectedPollGrps);
            pollgrpPicker.draw();
        });

         // add legend marker
          function addLegendMarker(markerProps) {
            var legendMarker = document.getElementById('template-legend-marker').innerHTML;
            for (var handle in markerProps) {
              if (markerProps.hasOwnProperty(handle)) {
                legendMarker = legendMarker.replace('{{' + handle + '}}', markerProps[handle]);
              }
            }
            document.getElementById('poll_legend').insertAdjacentHTML('beforeEnd', legendMarker);
          }

        // chart ready event
        google.visualization.events.addListener(pollgrpChart, 'ready', function () {
        var legend = document.getElementById('poll_legend');
        var colorPallette = pollgrpChart.getOption('colors');
        // clear previous legend
        legend.innerHTML = '';

        var selectedItem = pollgrpChart.getChart().getSelection()[0];
        if (selectedItem) {
            selectedPollGrps = pollgrpChart.getDataTable().getValue(selectedItem.row, 0);
            // console.log('in chart ready event, selectedPollGrps = ' + selectedPollGrps);
        }

        // for (item in pollgrpChart.getChart().getSelection()) {
        //     // console.log('hello');
        //     console.log(item);
        // }

        // add legend marker for each pollutant group
        for (i = 0; i < pollgrpGroup.getNumberOfRows(); i++) {
            var markerProps = {};
            markerProps.index = i;
            markerProps.color = colorPallette[i];
            markerProps.label = pollgrpGroup.getValue(i, 3);
            markerProps.value = pollgrpGroup.getValue(i, 0);
            addLegendMarker(markerProps);
        }

        // filter on pie chart legend click
        var markers = legend.getElementsByClassName('legend-marker');
        Array.prototype.forEach.call(markers, function(marker) {
          marker.addEventListener('click', function (e) {
            var marker = e.target || e.srcElement;
            marker = marker.parentNode;
            var columnIndex = parseInt(marker.getAttribute('data-columnIndex'), 10);
            selectedPollGrps = pollgrpChart.getDataTable().getValue(columnIndex, 0);
            pollgrpPicker.setState({'selectedValues': [selectedPollGrps]});
            pickerPollGrps= [selectedPollGrps];
            // console.log('under pollgrp legend select listener, selectedPollGrps = ' + selectedPollGrps);
            pollgrpPicker.draw();
          }, false);
        });
    });

        // // get chart titles
        finalCombinedTitle = combinedTitle;
        finalFyTitle = fyTitle;
        finalStateTitle = stateTitle;
        finalPollGrpTitle = pollgrpTitle;
        if (filterFyString) {
            finalCombinedTitle = filterFyString + ' ' + finalCombinedTitle;
            finalFyTitle = filterFyString + ' ' + finalFyTitle;
            finalStateTitle = filterFyString + ' ' + finalStateTitle;
            finalPollGrpTitle = filterFyString + ' ' + finalPollGrpTitle;
        }
        if (selectedRegions.length > 0 && selectedStates.length === 0) {
          finalCombinedTitle = finalCombinedTitle + ' in ' + selectedRegions;
          finalFyTitle = finalFyTitle + ' in ' + selectedRegions;
          finalStateTitle = finalStateTitle + ' in ' + selectedRegions;
          finalPollGrpTitle = finalPollGrpTitle + ' in ' + selectedRegions;
        }
        if (filteredStates.length > 0) {
            finalCombinedTitle = finalCombinedTitle + ' in ' + filteredStates.sort(collator.compare).join(', ');
            finalFyTitle = finalFyTitle + ' in ' + filteredStates.sort(collator.compare).join(', ');
            finalStateTitle = finalStateTitle + ' in ' + filteredStates.sort(collator.compare).join(', ');
            finalPollGrpTitle = finalPollGrpTitle + ' in ' + filteredStates.sort(collator.compare).join(', ');
        }
        if (filteredPollGrps.length > 0) {
          finalCombinedTitle = finalCombinedTitle + ' for ' + filteredPollGrps.sort(collator.compare).join(', ');
          finalFyTitle = finalFyTitle + ' for ' + filteredPollGrps.sort(collator.compare).join(', ');
          finalStateTitle = finalStateTitle + ' for ' + filteredPollGrps.sort(collator.compare).join(', ');
          finalPollGrpTitle = finalPollGrpTitle + ' for ' + filteredPollGrps.sort(collator.compare).join(', ');
        }

        // set the chart titles and draw the charts
        combinedChart.setOption('title', finalCombinedTitle);
        combinedChart.draw();

        fyChart.setOption('title', finalFyTitle);
        fyChart.draw();

        stateChart.setOption('title', finalStateTitle)
        stateChart.setOption('height', stateChartHeight)
        stateChart.draw();

        pollgrpChart.setOption('title', finalPollGrpTitle)
        pollgrpChart.draw();

    });

    dashboard
        .bind(fySlider, [regionPicker, statePicker, pollgrpPicker])
        .bind(regionPicker, statePicker)
        .bind([fySlider, regionPicker, statePicker, pollgrpPicker], proxyTable)
        .draw(data);
}

legacy = getUrlParam('legacy','N');
if (legacy !== 'N') {
    dataSource = legacyDataSource;
}
dataDownloadDate =
google.charts.load('current', {packages: ['corechart', 'controls', 'table']});
google.charts.setOnLoadCallback(initialize);
