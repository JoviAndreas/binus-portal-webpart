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
  link1Label: string; link1Url: string;
  link2Label: string; link2Url: string;
  link3Label: string; link3Url: string;
}

export default class DamsVblAdminWebPart extends BaseClientSideWebPart<IDamsVblAdminWebPartProps> {
  protected onInit(): Promise<void> {
    injectTokens();
    return super.onInit();
  }

  public render(): void {
    const p = this.properties;
    const links = [
      { label: p.link1Label, url: p.link1Url },
      { label: p.link2Label, url: p.link2Url },
      { label: p.link3Label, url: p.link3Url }
    ].filter((l) => l.label && l.url);

    const element: React.ReactElement<IDamsVblAdminProps> = React.createElement(DamsVblAdmin, {
      apiBaseUrl: p.apiBaseUrl || 'https://uploadvbl.apps.binus.ac.id/api',
      apiResourceUri: p.apiResourceUri || 'api://f3ce5232-7702-452f-b8a2-075adbf426fd',
      aadClientFactory: this.context.aadHttpClientFactory,
      links
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
            },
            {
              groupName: strings.LinksGroupName,
              groupFields: [
                PropertyPaneTextField('link1Label', { label: strings.Link1LabelLabel, placeholder: 'e.g. DAMS Library' }),
                PropertyPaneTextField('link1Url',   { label: strings.Link1UrlLabel,   placeholder: 'https://...' }),
                PropertyPaneTextField('link2Label', { label: strings.Link2LabelLabel, placeholder: 'e.g. BINUSMAYA' }),
                PropertyPaneTextField('link2Url',   { label: strings.Link2UrlLabel,   placeholder: 'https://...' }),
                PropertyPaneTextField('link3Label', { label: strings.Link3LabelLabel, placeholder: 'e.g. Report' }),
                PropertyPaneTextField('link3Url',   { label: strings.Link3UrlLabel,   placeholder: 'https://...' })
              ]
            }
          ]
        }
      ]
    };
  }
}
