import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import {
  IPropertyPaneConfiguration,
  PropertyPaneTextField
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';

import * as strings from 'BinusZoomBotWebPartStrings';
import { BinusZoomBot, IBinusZoomBotProps } from './components/BinusZoomBot';
import { injectTokens } from '../../shared/tokens';

export interface IBinusZoomBotWebPartProps {
  heading: string;
  eyebrow: string;
  subheading: string;
  apiBaseUrl: string;
  apiResourceUri: string;
  defaultHostEmail: string;
  defaultTimezone: string;
}

export default class BinusZoomBotWebPart extends BaseClientSideWebPart<IBinusZoomBotWebPartProps> {
  protected onInit(): Promise<void> {
    injectTokens();
    return super.onInit();
  }

  public render(): void {
    const element: React.ReactElement<IBinusZoomBotProps> = React.createElement(BinusZoomBot, {
      heading: this.properties.heading || 'Webinar',
      eyebrow: this.properties.eyebrow || 'DAMS',
      subheading: this.properties.subheading || 'Schedule a Zoom session. Recordings and transcripts archive automatically.',
      apiBaseUrl: this.properties.apiBaseUrl || 'https://knowledgemapping.thankfulsky-d80be677.southeastasia.azurecontainerapps.io/api/binuspages',
      apiResourceUri: this.properties.apiResourceUri || 'api://77e4afeb-4f7c-4341-bc6d-87c25f08e762',
      defaultHostEmail: this.properties.defaultHostEmail || 'km@binus.edu',
      defaultTimezone: this.properties.defaultTimezone || 'Asia/Jakarta',
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
                PropertyPaneTextField('subheading', { label: strings.SubheadingLabel, multiline: true }),
                PropertyPaneTextField('defaultHostEmail', { label: strings.HostEmailLabel }),
                PropertyPaneTextField('defaultTimezone', { label: strings.TimezoneLabel })
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
