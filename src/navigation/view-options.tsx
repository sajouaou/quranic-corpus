import { useSettings } from '../settings/settings-context';
import { SettingsService } from '../settings/settings-service';
import { TranslationService } from '../corpus/translation/translation-service';
import { Dropdown } from '../components/dropdown';
import { container } from 'tsyringe';
import './view-options.scss';

const views = [
    { readerMode: false, label: 'Detail' },
    { readerMode: true, label: 'Reader' }
]

// How the chapter is displayed: the layout of the words and which translations are shown.
export const ViewOptions = () => {
    const translationService = container.resolve(TranslationService);
    const settingsService = container.resolve(SettingsService);
    const { settings } = useSettings();
    const { readerMode } = settings;

    return (
        <div className='view-options'>
            <div className='views' role='group' aria-label='Layout'>
                {
                    views.map(view => (
                        <button
                            key={view.label}
                            type='button'
                            className={view.readerMode === readerMode ? 'selected' : undefined}
                            aria-pressed={view.readerMode === readerMode}
                            onClick={() => settingsService.saveSettings({ ...settings, readerMode: view.readerMode })}>
                            {view.label}
                        </button>
                    ))
                }
            </div>
            <Dropdown
                className='translations'
                title='Choose the translations to show'
                align='right'
                label={
                    <>
                        <span className='full'>Translations</span>
                        <svg className='icon' viewBox='0 0 24 24' aria-hidden='true'>
                            <circle cx='12' cy='12' r='9' />
                            <path d='M3 12h18M12 3c3.5 3.5 3.5 14.5 0 18M12 3c-3.5 3.5-3.5 14.5 0 18' />
                        </svg>
                        <span className='count'>{settings.translations.length}</span>
                    </>
                }>
                {
                    () => (
                        <fieldset className='translation-list'>
                            <legend className='visually-hidden'>Translations</legend>
                            {
                                translationService.translations.map(({ key, name }) => (
                                    <label key={key}>
                                        <input
                                            type='checkbox'
                                            checked={settingsService.hasTranslation(key)}
                                            onChange={() => settingsService.saveSettings({
                                                ...settings,
                                                translations: translationService.toggleTranslation(settings.translations, key)
                                            })} />
                                        {name}
                                    </label>
                                ))
                            }
                        </fieldset>
                    )
                }
            </Dropdown>
        </div>
    )
}
