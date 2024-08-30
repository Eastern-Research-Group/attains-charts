import json, csv, urllib.request
import states
import datetime
from operator import itemgetter
from itertools import groupby
import collections
import os
import pandas as pd
import save_data_download_date as dt

outfile = 'tmdls.csv'

def getFiscalYear(date):
    d = date.split('-')
    year = d[0]
    month = d[1]
    if month > '09':
        year = str(int(year) + 1)
    return year

# create parameter/parameter group lookup dictionary
xlsfile = 'parameterLUT.xlsx'
df = pd.read_excel(xlsfile)
parameterDict = {}
for idx, row in df.iterrows():
    parameterDict[row['PARAMETER_CODE_NAME']] = row['PARAMETER_GROUP_CODE_NAME']
# print(parameterDict)

tmdlList = []

directory = os.fsencode('json')

for file in os.listdir(directory):
    filename = os.fsdecode(file)
    if filename != 'parameters.json':
    # if filename == 'CA.json':
        print(filename)
        with open('json/' + filename, encoding='utf8') as jsonfile:
            tmdls = json.load(jsonfile)

        for item in tmdls['items']:
            for action in item['actions']:
                # print(action['completionDate'])
                for au in action['associatedWaters']['specificWaters']:
                    # print('   ', au['assessmentUnitIdentifier'])
                    for pollutant in au['associatedPollutants']:
                        # print('      ', pollutant['pollutantName'])
                        tmdlList.append({'FiscalYear': getFiscalYear(action['completionDate']),
                                         # 'Region': states.orgRegion.get(item['organizationIdentifier']),
                                         'State': states.orgState.get(item['organizationIdentifier']),
                                         # 'PollutantGroup': parameterDict.get(pollutant['pollutantName'], pollutant['pollutantName']),
                                         'Pollutant': pollutant['pollutantName'],
                                         'AssessmentUnitId': au['assessmentUnitIdentifier']})

        # [i for n, i in enumerate(tmdlList) if not i in tmdlList[n + 1:]]
        jsonfile.close()
# print(tmdlList)
# print(len(tmdlList))

# Some TMDLS older than FY 1996 appear in downloads even though a range of TMDL Dates are passed
tmdlList2 = [i for i in tmdlList if not (int(i['FiscalYear']) <= 1996)]
# print(tmdlList2)

tmdlCounts = []
tmdlList2.sort(key=itemgetter('FiscalYear','State','Pollutant'))
for key, group in groupby(tmdlList2, key=itemgetter('FiscalYear','State','Pollutant')):
    tempDict = dict(zip(['FiscalYear','State','Pollutant'], key))
    cnt = 0
    for i in group:
        cnt = cnt + 1
    tempDict['NumberOfTMDLs'] = cnt
    # print(tempDict)
    tmdlCounts.append(tempDict)
# print(tmdlCounts)

# create a list of fiscal years starting with 1996 and going through the current year
fys = []
now = datetime.datetime.now()
now = now.strftime("%Y-%m-%d")
maxFy = getFiscalYear(now)
for year in range(1996, int(maxFy)):
    fys.append(str(year))

# create list of unique FY/State/Pollutant combinations; a row must exist for every pollutant
# in the state for every FY, even if the NumberOfTMDLs is 0
tmdlCounts.sort(key=itemgetter('State','Pollutant','FiscalYear'))
comparisonList = []
for key, group in groupby(tmdlCounts, key=itemgetter('FiscalYear','State','Pollutant')):
    tempDict = dict(zip(['FiscalYear','State','Pollutant'], key))
    # print(tempDict)
    comparisonList.append({'FiscalYear': tempDict['FiscalYear'],
                           'State': tempDict['State'],
                           'Pollutant': tempDict['Pollutant']})
# print(comparisonList)

# Find which State/Pollutants need a "0" row for which FYs, then add them to the tmdlCounts list
tmdlZeroCounts = []
for key, group in groupby(tmdlCounts, key=itemgetter('State','Pollutant')):
    tempDict = dict(zip(['State','Pollutant'], key))
    # print(tempDict)
    for fy in fys:
        # print(str(int(fy)+1), tempDict)
        comparisionDict = {'FiscalYear': str(int(fy)+1), 'State': tempDict['State'], 'Pollutant': tempDict['Pollutant']}
        if not comparisionDict in comparisonList:
            # print(str(int(fy) + 1), tempDict['State'],  tempDict['Pollutant'])
            tmdlZeroCounts.append({'FiscalYear': str(int(fy) + 1),
                                'State': tempDict['State'],
                                'Pollutant': tempDict['Pollutant'],
                                'NumberOfTMDLs': 0})
print('tmdlCounts = ', len(tmdlCounts))
print('tmdlZeroCounts = ', len(tmdlZeroCounts))
tmdlCounts += tmdlZeroCounts
print('new tmdlCounts = ', len(tmdlCounts))
# re-sort the dictionary after new values added
tmdlCounts.sort(key=itemgetter('State','Pollutant','FiscalYear'))

# Add the region, pollutant group, and cumulative counts
state = ''
pollutant = ''
fy = ''
numtmdls = 0
cumsum = 0
for d in tmdlCounts:
    if d['State'] != state:
        fy = d['State']
        if d['Pollutant'] != pollutant:
            pollutant = d['Pollutant']
            if d['FiscalYear'] != fy:
                fy = d['FiscalYear']
                cumSum = 0
    numtmdls = d['NumberOfTMDLs']
    cumSum = cumSum + numtmdls
    d['CumulativeTMDLs'] = cumSum
    d['Region'] = states.stateRegion.get(d['State'])
    d['PollutantGroup'] = parameterDict.get(d['Pollutant'], d['Pollutant'])
    # print(d['FiscalYear'] + " " + d['Pollutant'] + " " + str(d['NumberOfTMDLs']) + " " + str(d['CumulativeTMDLs']))

# re-sort
tmdlCounts.sort(key=itemgetter('FiscalYear','Region','State','PollutantGroup','Pollutant'))

# order dictionary keys
tmdlCounts2 = []
for d in tmdlCounts:
    tmdlCounts2.append({'FiscalYear': d['FiscalYear'],
                        'Region': d['Region'],
                        'State': d['State'],
                        'PollutantGroup': d['PollutantGroup'],
                        'Pollutant': d['Pollutant'],
                        'NumberOfTMDLs': d['NumberOfTMDLs'],
                        'CumulativeTMDLs': d['CumulativeTMDLs']})

# for d in tmdlCounts2:
#     print(d)

# write to CSV
keys = tmdlCounts2[0].keys()
with open(outfile, 'w', newline='\n', encoding='utf-8') as output_file:
    dict_writer = csv.DictWriter(output_file, keys, delimiter=',', quoting=csv.QUOTE_MINIMAL)
    dict_writer.writeheader()
    dict_writer.writerows(tmdlCounts)

# save the date downloaded to an external file
today = datetime.datetime.now().strftime('%Y-%m-%d')
text = """downloadDate =  '""" + today + """';

window.onload = function() {
   document.getElementById("downloadDate").innerHTML = 'Data in these charts were downloaded from the ATTAINS web services on ' + downloadDate + '.';
}""";
with open('js/downloadDate.js', 'w', encoding='utf-8') as output_file:
    output_file.write(text)
