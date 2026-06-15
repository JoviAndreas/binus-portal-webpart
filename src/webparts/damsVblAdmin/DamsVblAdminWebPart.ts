import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import { IPropertyPaneConfiguration, PropertyPaneTextField } from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';

import * as strings from 'DamsVblAdminWebPartStrings';
import { DamsVblAdmin, IDamsVblAdminProps } from './components/DamsVblAdmin';
import { injectTokens } from '../../shared/tokens';

export interface IDamsVblAdminWebPartProps {
  apiBaseUrl: string;
  apiResourceUri: string;
}

export default class DamsVblAdminWebPart extends BaseClientSideWebPart<IDamsVblAdminWebPartProps> {
  protected onInit(): Promise<void> {
    injectTokens();
    return super.onInit();
  }

  public render(): void {
    const element: React.ReactElement<IDamsVblAdminProps> = React.createElement(DamsVblAdmin, {
      apiBaseUrl: this.properties.apiBaseUrl || 'https://uploadvbl.apps.binus.ac.id/api',
      apiResourceUri: this.properties.apiResourceUri || 'api://f3ce5232-7702-452f-b8a2-075adbf426fd',
      aadClientFactory: this.context.aadHttpClientFactory
    });
    ReactDom.render(element, this.domElement);
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: { description: strings.PropertyPaneDescription },
          groups: [
            {
              groupName: strings.ApiGroupName,
              groupFields: [
                PropertyPaneTextField('apiBaseUrl', { label: strings.ApiBaseLabel }),
                PropertyPaneTextField('apiResourceUri', { label: strings.ResourceUriLabel })
              ]
            }
          ]
        }
      ]
    };
  }
}
