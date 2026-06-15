import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import {
  IPropertyPaneConfiguration,
  PropertyPaneTextField
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';

import * as strings from 'BinusAppLauncherWebPartStrings';
import { BinusAppLauncher, IBinusAppLauncherProps } from './components/BinusAppLauncher';
import { injectTokens } from '../../shared/tokens';
import { parseConfig, defaultConfigJson } from '../../shared/categoriesConfig';

export interface IBinusAppLauncherWebPartProps {
  heading: string;
  subheading: string;
  listTitle: string;
  categoriesJson: string;
}

export default class BinusAppLauncherWebPart extends BaseClientSideWebPart<IBinusAppLauncherWebPartProps> {
  protected onInit(): Promise<void> {
    injectTokens();
    return super.onInit();
  }

  public render(): void {
    const element: React.ReactElement<IBinusAppLauncherProps> = React.createElement(BinusAppLauncher, {
      heading: this.properties.heading || 'Application Link',
      subheading: this.properties.subheading || '',
      listTitle: this.properties.listTitle || 'Application Link',
      webUrl: this.context.pageContext.web.absoluteUrl,
      spHttpClient: this.context.spHttpClient,
      config: parseConfig(this.properties.categoriesJson)
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
                PropertyPaneTextField('subheading', { label: strings.SubheadingLabel }),
                PropertyPaneTextField('listTitle', { label: strings.ListTitleLabel })
              ]
            },
            {
              groupName: 'Categories',
              groupFields: [
                PropertyPaneTextField('categoriesJson', {
                  label: 'Categories JSON (leave empty for defaults)',
                  multiline: true,
                  rows: 14,
                  placeholder: defaultConfigJson().substring(0, 200) + '...'
                })
              ]
            }
          ]
        }
      ]
    };
  }
}
