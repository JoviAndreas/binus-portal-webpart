import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import {
  IPropertyPaneConfiguration,
  PropertyPaneTextField
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';

import * as strings from 'BinusHeroWebPartStrings';
import { BinusHero, IBinusHeroProps } from './components/BinusHero';
import { injectTokens } from '../../shared/tokens';
import { parseFeatured, defaultFeaturedJson } from '../../shared/featuredConfig';

export interface IBinusHeroWebPartProps {
  title: string;
  subtitle: string;
  featuredJson: string;
}

export default class BinusHeroWebPart extends BaseClientSideWebPart<IBinusHeroWebPartProps> {
  protected onInit(): Promise<void> {
    injectTokens();
    return super.onInit();
  }

  public render(): void {
    const element: React.ReactElement<IBinusHeroProps> = React.createElement(BinusHero, {
      title: this.properties.title || 'Welcome to new BINUS Portal',
      subtitle: this.properties.subtitle || '',
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
              groupName: strings.BasicGroupName,
              groupFields: [
                PropertyPaneTextField('title', { label: strings.TitleLabel }),
                PropertyPaneTextField('subtitle', { label: strings.SubtitleLabel, multiline: true })
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
            }
          ]
        }
      ]
    };
  }
}
