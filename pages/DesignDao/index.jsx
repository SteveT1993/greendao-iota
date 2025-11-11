import React, { useState, useEffect } from "react";
import Head from "next/head"
import Image from "next/image"
import NavLink from "next/link"
import Card from "../../components/components/Card/Card"
import isServer from "../../components/isServer"
import { gjsPlugin } from '../../components/plugin/gjsPlugin';

import useContract from '../../services/useContract'
import { useIOTA } from '../../contexts/IOTAContext'
import { Transaction } from '@iota/iota-sdk/transactions'

import 'grapesjs/dist/css/grapes.min.css';

let DaoURI = ({ Title: "", Description: "", SubsPrice: 0, Start_Date: "", End_Date: "", logo: "", wallet: "", typeimg: "", allFiles: [], isOwner: false });
let loadedEditor= false;
export default function DesignDao() {

	const sleep = milliseconds => {
		return new Promise(resolve => setTimeout(resolve, milliseconds))
	}
  // Use IOTA context for on-chain reads/writes
  const { daos, sendTransaction, currentWalletAddress } = useIOTA();

  const [list, setList] = useState([]);

  const [editor, setEditor] = useState(null);
  const regex = /\[(.*)\]/g
  let m
  let id = "" //id from url

  useEffect(() => {
    LoadEditor();
  }, [daos])
  if (isServer()) return null
  const str = decodeURIComponent(window.location.search)

  while ((m = regex.exec(str)) !== null) {
    if (m.index === regex.lastIndex) {
      regex.lastIndex++
    }
    id = (m[1]);
  }

  async function LoadEditor() {
    if (typeof window == 'undefined' || id === null) {
      return null;
    }
    await fetchContractData();
    if (editor  != null || loadedEditor) return;
    loadedEditor=true;
    await sleep(1500);
    // Load grapesjs via a CDN script to avoid webpack/SSR import issues.
    if (!window.grapesjs) {
      await new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = 'https://unpkg.com/grapesjs/dist/grapes.min.js';
        s.async = true;
        s.onload = () => resolve(true);
        s.onerror = (e) => reject(e);
        document.head.appendChild(s);
      });
    }
    const grapesjs = window.grapesjs;
        if (editor != null) return;
    await sleep(500);
    // Dynamically import grapesjs and plugins on the client to avoid SSR/module issues
    const [
      grapesjs_preset_webpage,
      grapesjs_plugin_forms,
      grapesjs_plugin_export,
      grapesjs_custom_code,
      grapesjs_parser_postcss,
      grapesjs_tooltip,
      grapesjs_tui_image_editor,
      grapesjs_typed,
      grapesjs_style_bg,
      gjs_blocks_basic
    ] = await Promise.all([
      import('grapesjs-preset-webpage'),
      import('grapesjs-plugin-forms'),
      import('grapesjs-plugin-export'),
      import('grapesjs-custom-code'),
      import('grapesjs-parser-postcss'),
      import('grapesjs-tooltip'),
      import('grapesjs-tui-image-editor'),
      import('grapesjs-typed'),
      import('grapesjs-style-bg'),
      import('grapesjs-blocks-basic')
    ]);

    // unwrap default exports for plugins
    const _preset = grapesjs_preset_webpage.default || grapesjs_preset_webpage;
    const _forms = grapesjs_plugin_forms.default || grapesjs_plugin_forms;
    const _export = grapesjs_plugin_export.default || grapesjs_plugin_export;
    const _custom = grapesjs_custom_code.default || grapesjs_custom_code;
    const _parser = grapesjs_parser_postcss.default || grapesjs_parser_postcss;
    const _tooltip = grapesjs_tooltip.default || grapesjs_tooltip;
    const _tui = grapesjs_tui_image_editor.default || grapesjs_tui_image_editor;
    const _typed = grapesjs_typed.default || grapesjs_typed;
    const _stylebg = grapesjs_style_bg.default || grapesjs_style_bg;


    

    // Initialize with just the local gjsPlugin to avoid loading many plugins that may
    // introduce additional globals or require extra assets. We can add plugins later
    // by loading their UMD bundles if needed.
    var editor = grapesjs.init({
      container: '#editor',
      fromElement: true,
      showOffsets: true,
      storageManager: false,

      autosave: false, // Store data automatically
      autoload: false, // Autoload stored data on init
      assetManager: {
        embedAsBase64: true,
      },

      styleManager: {
        sectors: [{
          name: 'General',
          properties: [
            {
              extend: 'float',
              type: 'radio',
              default: 'none',
              options: [
                { value: 'none', className: 'fa fa-times' },
                { value: 'left', className: 'fa fa-align-left' },
                { value: 'right', className: 'fa fa-align-right' }
              ],
            },
            'display',
            { extend: 'position', type: 'select' },
            'top',
            'right',
            'left',
            'bottom',
          ],
        }, {
          name: 'Dimension',
          open: false,
          properties: [
            'width',
            {
              id: 'flex-width',
              type: 'integer',
              name: 'Width',
              units: ['px', '%'],
              property: 'flex-basis',
              toRequire: 1,
            },
            'height',
            'max-width',
            'min-height',
            'margin',
            'padding'
          ],
        }, {
          name: 'Typography',
          open: false,
          properties: [
            'font-family',
            'font-size',
            'font-weight',
            'letter-spacing',
            'color',
            'line-height',
            {
              extend: 'text-align',
              options: [
                { id: 'left', label: 'Left', className: 'fa fa-align-left' },
                { id: 'center', label: 'Center', className: 'fa fa-align-center' },
                { id: 'right', label: 'Right', className: 'fa fa-align-right' },
                { id: 'justify', label: 'Justify', className: 'fa fa-align-justify' }
              ],
            },
            {
              property: 'text-decoration',
              type: 'radio',
              default: 'none',
              options: [
                { id: 'none', label: 'None', className: 'fa fa-times' },
                { id: 'underline', label: 'underline', className: 'fa fa-underline' },
                { id: 'line-through', label: 'Line-through', className: 'fa fa-strikethrough' }
              ],
            },
            'text-shadow'
          ],
        }, {
          name: 'Decorations',
          open: false,
          properties: [
            'opacity',
            'border-radius',
            'border',
            'box-shadow',
            'background', // { id: 'background-bg', property: 'background', type: 'bg' }
          ],
        }, {
          name: 'Extra',
          open: false,
          buildProps: [
            'transition',
            'perspective',
            'transform'
          ],
        }, {
          name: 'Flex',
          open: false,
          properties: [{
            name: 'Flex Container',
            property: 'display',
            type: 'select',
            defaults: 'block',
            list: [
              { value: 'block', name: 'Disable' },
              { value: 'flex', name: 'Enable' }
            ],
          }, {
            name: 'Flex Parent',
            property: 'label-parent-flex',
            type: 'integer',
          }, {
            name: 'Direction',
            property: 'flex-direction',
            type: 'radio',
            defaults: 'row',
            list: [{
              value: 'row',
              name: 'Row',
              className: 'icons-flex icon-dir-row',
              title: 'Row',
            }, {
              value: 'row-reverse',
              name: 'Row reverse',
              className: 'icons-flex icon-dir-row-rev',
              title: 'Row reverse',
            }, {
              value: 'column',
              name: 'Column',
              title: 'Column',
              className: 'icons-flex icon-dir-col',
            }, {
              value: 'column-reverse',
              name: 'Column reverse',
              title: 'Column reverse',
              className: 'icons-flex icon-dir-col-rev',
            }],
          }, {
            name: 'Justify',
            property: 'justify-content',
            type: 'radio',
            defaults: 'flex-start',
            list: [{
              value: 'flex-start',
              className: 'icons-flex icon-just-start',
              title: 'Start',
            }, {
              value: 'flex-end',
              title: 'End',
              className: 'icons-flex icon-just-end',
            }, {
              value: 'space-between',
              title: 'Space between',
              className: 'icons-flex icon-just-sp-bet',
            }, {
              value: 'space-around',
              title: 'Space around',
              className: 'icons-flex icon-just-sp-ar',
            }, {
              value: 'center',
              title: 'Center',
              className: 'icons-flex icon-just-sp-cent',
            }],
          }, {
            name: 'Align',
            property: 'align-items',
            type: 'radio',
            defaults: 'center',
            list: [{
              value: 'flex-start',
              title: 'Start',
              className: 'icons-flex icon-al-start',
            }, {
              value: 'flex-end',
              title: 'End',
              className: 'icons-flex icon-al-end',
            }, {
              value: 'stretch',
              title: 'Stretch',
              className: 'icons-flex icon-al-str',
            }, {
              value: 'center',
              title: 'Center',
              className: 'icons-flex icon-al-center',
            }],
          }, {
            name: 'Flex Children',
            property: 'label-parent-flex',
            type: 'integer',
          }, {
            name: 'Order',
            property: 'order',
            type: 'integer',
            defaults: 0,
            min: 0
          }, {
            name: 'Flex',
            property: 'flex',
            type: 'composite',
            properties: [{
              name: 'Grow',
              property: 'flex-grow',
              type: 'integer',
              defaults: 0,
              min: 0
            }, {
              name: 'Shrink',
              property: 'flex-shrink',
              type: 'integer',
              defaults: 0,
              min: 0
            }, {
              name: 'Basis',
              property: 'flex-basis',
              type: 'integer',
              units: ['px', '%', ''],
              unit: '',
              defaults: 'auto',
            }],
          }, {
            name: 'Align',
            property: 'align-self',
            type: 'radio',
            defaults: 'auto',
            list: [{
              value: 'auto',
              name: 'Auto',
            }, {
              value: 'flex-start',
              title: 'Start',
              className: 'icons-flex icon-al-start',
            }, {
              value: 'flex-end',
              title: 'End',
              className: 'icons-flex icon-al-end',
            }, {
              value: 'stretch',
              title: 'Stretch',
              className: 'icons-flex icon-al-str',
            }, {
              value: 'center',
              title: 'Center',
              className: 'icons-flex icon-al-center',
            }],
          }]
        }
        ],
      },
      plugins: [
  gjsPlugin,
    _preset,
    _forms,
    _export,
    _custom,
    _parser,
    _tooltip,
    _tui,
    _typed,
    _stylebg,
    

       

      ],
      pluginsOpts: {
        gjs_blocks_basic: { flexGrid: true },
        'grapesjs-tui-image-editor': {
          script: [
            // 'https://cdnjs.cloudflare.com/ajax/libs/fabric.js/1.6.7/fabric.min.js',
            'https://uicdn.toast.com/tui.code-snippet/v1.5.2/tui-code-snippet.min.js',
            'https://uicdn.toast.com/tui-color-picker/v2.2.7/tui-color-picker.min.js',
            'https://uicdn.toast.com/tui-image-editor/v3.15.2/tui-image-editor.min.js'
          ],
          style: [
            'https://uicdn.toast.com/tui-color-picker/v2.2.7/tui-color-picker.min.css',
            'https://uicdn.toast.com/tui-image-editor/v3.15.2/tui-image-editor.min.css',

          ],
        },
        'grapesjs-tabs': {
          tabsBlock: { category: 'Extra' }
        },
        'grapesjs-typed': {
          block: {
            category: 'Extra',
            content: {
              type: 'typed',
              'type-speed': 40,
              strings: [
                'Text row one',
                'Text row two',
                'Text row three',
              ],
            }
          }
        },
        'grapesjs-preset-webpage': {
          modalImportTitle: 'Import Template',
          modalImportLabel: '<div style="margin-bottom: 10px; font-size: 13px;">Paste here your HTML/CSS and click Import</div>',
          modalImportContent: function (editor) {
            return editor.getHtml() + '<style>' + editor.getCss() + '</style>'
          },
        },
      },
      canvas: {
        styles: [
          'https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/css/bootstrap.min.css',
          '/output.css',
          '/css/daos.css',
          '/theme.css',
          '/css/ideas.css',
        ],
        scripts: [
          'https://code.jquery.com/jquery-3.3.1.slim.min.js',
          'https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.3/umd/popper.min.js',
          'https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/js/bootstrap.min.js'
        ],
      }
    });
    setEditor(editor);

    // If the standard basic blocks plugin didn't register (due to CDN block or timing),
    // add a small fallback set of useful blocks so the editor isn't empty.
    function addFallbackBlocks(ed) {
      try {
        const blocks = ed.Blocks;
        // Text block
        if (!blocks.get('text')) {
          blocks.add('text', {
            label: 'Text',
            category: 'Basic',
            content: '<p>Insert your text here</p>',
            attributes: { class: 'gjs-fonts' }
          });
        }
        // Image block
        if (!blocks.get('image')) {
          blocks.add('image', {
            label: 'Image',
            category: 'Basic',
            content: { type: 'image' },
            attributes: { class: 'fa fa-image' }
          });
        }
        // Link block
        if (!blocks.get('link')) {
          blocks.add('link', {
            label: 'Link',
            category: 'Basic',
            content: '<a href="#">Link</a>',
            attributes: { class: 'fa fa-link' }
          });
        }
        // Section / Container
        if (!blocks.get('section')) {
          blocks.add('section', {
            label: 'Section',
            category: 'Layout',
            content: '<section><h2>Section</h2><p>Section content</p></section>',
            attributes: { class: 'fa fa-square' }
          });
        }
      } catch (e) {
        console.warn('addFallbackBlocks error', e);
      }
    }

    // Give a slight delay to allow plugin UMDs to register; then add fallback blocks if needed.
    setTimeout(() => addFallbackBlocks(editor), 700);
  }

  async function SaveHTML() {
    let output = editor.getHtml() + "<style>" + editor.getCss() + "</style>";

    // Build and send an IOTA Move transaction to update the template
    const tx = new Transaction();
    await sendTransaction(tx, 'update_template', [Number(id), output]);
  }

  async function fetchContractData() {

    //Fetching data from Smart contract
    try {
      if (daos && id != null) {
        // find the dao object provided by IOTA context
        const dao = daos.find(d => String(d?.id?.id) === String(id) || String(d?.id) === String(id));
        if (dao) {
          // dao.dao_uri may be stored as a move value object or raw string; handle both
          const daoUriRaw = dao.dao_uri?.value || dao.dao_uri;
          let daoURI = {};
          try {
            daoURI = JSON.parse(daoUriRaw);
          } catch (e) {
            console.warn('Failed to parse dao_uri for dao', id, e);
            daoURI = {};
          }

          // template may be a string or wrapped value in different shapes coming from the client API
          const template_html = (dao.template) || '';
          if (document.querySelector("#dao-container")) document.querySelector("#dao-container").innerHTML = template_html;

          // goals: not yet indexed via IOTA context getters here, leave empty for now
          setList([])

          DaoURI = ({
            Title: (daoURI.title)  || '',
            Description: (daoURI.description)  || '',
            Start_Date: (daoURI.start_date)  || '',
            logo: (daoURI.logo)  || '',
            wallet: (dao.dao_wallet)  || '',
            typeimg: (daoURI.typeimg)  || '',
            allFiles: (daoURI.allFiles)  || '',
            SubsPrice: (daoURI.subs_price) ,
            isOwner: ((dao.dao_wallet)  || '').toString().toLocaleLowerCase() === (currentWalletAddress || '').toString().toLocaleLowerCase() ? true : false
          })
        }
      }
    } catch (error) {
      console.error(error);
    }
  }

  let button_class = "py-2 px-4 gap-2 text-moon-14 rounded-moon-i-sm relative z-0 flex justify-center items-center font-medium no-underline overflow-hidden select-none outline-none transition duration-200 active:scale-90 focus-visible:shadow-focus btn-primary";

  return (
    <div>
      <Head>
        <title>Customize {DaoURI.Title}</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div id="editor">
        <div id="dao-container"></div>
      </div>
      <div style={{
        display: 'flex',
        justifyContent: 'flex-end',
        padding: '12px 2rem'
      }}><button onClick={SaveHTML} className={button_class + " px-8"}>Save</button></div>
    </div>

  );
}
