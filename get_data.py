import json
import urllib.request
import states

def get_state_data(state):
    print(f'Working on {state}...')
    url = f'https://attains.epa.gov/attains-public/api/actions?stateCode={state}&actionTypeCode=TMDL&tmdlDateLaterThan=1995-09-30&actionStatusCode=EPA%20Final%20Action,State%20Final%20Action'
    print(f'URL is {url}')
    fileloc = 'json/' + state + '.json'
    urllib.request.urlretrieve(url, fileloc)

def main():
    print('Starting downloads')

    # download the current parameter lut
    urllib.request.urlretrieve("https://attains.epa.gov/attains-public/api/domains?domainName=ParameterName", "json/parameters.json")
    
    for state in states.orgState.values():
        get_state_data(state)

    print('Downloading finished')

if __name__ == '__main__':
    main()
    # # get_state_data('AL')
    # # get_state_data('AZ')
    # # get_state_data('GA')
    # # get_state_data('CT')
    # # get_state_data('ID')
    # # get_state_data('IN')
    # # get_state_data('KS')
    # # get_state_data('MA')
    # # get_state_data('TN')
    # get_state_data('OR')
    # # get_state_data('WA')
    # get_state_data('WY')
    
