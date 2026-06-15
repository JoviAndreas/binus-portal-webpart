import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import {
  IPropertyPaneConfiguration,
  PropertyPaneTextField
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';

import * as strings from 'BinusPagesWebPartStrings';
import { BinusPages, IBinusPagesProps } from './components/BinusPages';
import { injectTokens } from '../../shared/tokens';

export interface IBinusPagesWebPartProps {
  heading: string;
  subheading: string;
  apiBaseUrl: string;
  apiResourceUri: string;
}

export default class BinusPagesWebPart extends BaseClientSideWebPart<IBinusPagesWebPartProps> {
  protected onInit(): Promise<void> {
    injectTokens();
    return super.onInit();
  }

  public render(): void {
    const element: React.ReactElement<IBinusPagesProps> = React.createElement(BinusPages, {
      heading: this.properties.heading || 'BinusPages',
      subheading: this.properties.subheading || '',
      apiBaseUrl: this.properties.apiBaseUrl || 'https://binuspages-api.apps.binus.edu/api',
      apiResourceUri: this.properties.apiResourceUri || 'api://bf54af47-f3d8-4533-a392-711c1d04cdea',
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
              groupName: strings.BasicGroupName,
              groupFields: [
                PropertyPaneTextField('heading', { label: strings.HeadingLabel }),
                PropertyPaneTextField('subheading', { label: strings.SubheadingLabel })
              ]
            },
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
