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

export interface IBinusHomepageWebPartProps {
  heroTitle: string;
  heroSubtitle: string;
  ctaLabel: string;
  ctaUrl: string;
  launcherHeading: string;
  launcherSubheading: string;
  listTitle: string;
}

export default class BinusHomepageWebPart extends BaseClientSideWebPart<IBinusHomepageWebPartProps> {
  protected onInit(): Promise<void> {
    injectTokens();
    return super.onInit();
  }

  public render(): void {
    const element: React.ReactElement<IBinusHomepageProps> = React.createElement(BinusHomepage, {
      heroTitle: this.properties.heroTitle || 'Welcome to BINUS Portal',
      heroSubtitle: this.properties.heroSubtitle || 'Your one-stop access to academics, services, and BINUS Group.',
      ctaLabel: this.properties.ctaLabel || 'Explore apps',
      ctaUrl: this.properties.ctaUrl || '#apps',
      launcherHeading: this.properties.launcherHeading || 'Application Link',
      launcherSubheading: this.properties.launcherSubheading || 'Quick access to every BINUS service.',
      listTitle: this.properties.listTitle || 'Application Link',
      webUrl: this.context.pageContext.web.absoluteUrl,
      spHttpClient: this.context.spHttpClient
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
                PropertyPaneTextField('heroSubtitle', { label: strings.HeroSubtitleLabel, multiline: true }),
                PropertyPaneTextField('ctaLabel', { label: strings.CtaLabelLabel }),
                PropertyPaneTextField('ctaUrl', { label: strings.CtaUrlLabel })
              ]
            },
            {
              groupName: strings.LauncherGroupName,
              groupFields: [
                PropertyPaneTextField('launcherHeading', { label: strings.LauncherHeadingLabel }),
                PropertyPaneTextField('launcherSubheading', { label: strings.LauncherSubheadingLabel }),
                PropertyPaneTextField('listTitle', { label: strings.ListTitleLabel })
              ]
            }
          ]
        }
      ]
    };
  }
}
