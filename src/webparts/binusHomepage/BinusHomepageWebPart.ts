import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import {
  IPropertyPaneConfiguration,
  PropertyPaneTextField
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';

import * as strings from 'BinusHomepageWebPartStrings';
import { BinusHomepage, IBinusHomepageProps } from './components/BinusHomepage';
import { injectTokens } from '../../shared/tokens';
import { parseConfig, defaultConfigJson } from '../../shared/categoriesConfig';
import { parseFeatured, defaultFeaturedJson } from '../../shared/featuredConfig';

export interface IBinusHomepageWebPartProps {
  heroTitle: string;
  heroSubtitle: string;
  launcherHeading: string;
  launcherSubheading: string;
  listTitle: string;
  newsListTitle: string;
  categoriesJson: string;
  featuredJson: string;
}

export default class BinusHomepageWebPart extends BaseClientSideWebPart<IBinusHomepageWebPartProps> {
  protected onInit(): Promise<void> {
    injectTokens();
    return super.onInit();
  }

  public render(): void {
    const element: React.ReactElement<IBinusHomepageProps> = React.createElement(BinusHomepage, {
      heroTitle: this.properties.heroTitle || 'Welcome to new BINUS Portal',
      heroSubtitle: this.properties.heroSubtitle || '',
      launcherHeading: this.properties.launcherHeading || 'Application Link',
      launcherSubheading: this.properties.launcherSubheading || '',
      listTitle: this.properties.listTitle || 'Application Link',
      newsListTitle: this.properties.newsListTitle || 'Site Pages',
      webUrl: this.context.pageContext.web.absoluteUrl,
      spHttpClient: this.context.spHttpClient,
      config: parseConfig(this.properties.categoriesJson),
      featured: parseFeatured(this.properties.featuredJson)
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
              groupName: strings.HeroGroupName,
              groupFields: [
                PropertyPaneTextField('heroTitle', { label: strings.HeroTitleLabel }),
                PropertyPaneTextField('heroSubtitle', { label: strings.HeroSubtitleLabel, multiline: true })
              ]
            },
            {
              groupName: strings.LauncherGroupName,
              groupFields: [
                PropertyPaneTextField('launcherHeading', { label: strings.LauncherHeadingLabel }),
                PropertyPaneTextField('launcherSubheading', { label: strings.LauncherSubheadingLabel }),
                PropertyPaneTextField('listTitle', { label: strings.ListTitleLabel })
              ]
            },
            {
              groupName: 'News',
              groupFields: [
                PropertyPaneTextField('newsListTitle', {
                  label: 'News list title (empty to disable)',
                  placeholder: 'Site Pages'
                })
              ]
            },
            {
              groupName: 'Featured cards',
              groupFields: [
                PropertyPaneTextField('featuredJson', {
                  label: 'Featured JSON (leave empty for defaults)',
                  multiline: true,
                  rows: 14,
                  placeholder: defaultFeaturedJson().substring(0, 200) + '...'
                })
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
