import { Photo } from '@/components/photo'
import { CtaButton } from './cta-button'
import type { Photo as PhotoType } from '@/lib/types'

const USER_ID = 'cd99d106-419b-4ebf-aa09-29e5f6d688d1'

const SHOWCASE_PHOTOS: PhotoType[] = [
  { id: '399055f8-1f30-4fec-9e4a-242badf8a9c1', moment_id: 'a65052a1-737b-4480-9dae-b4e09aba0d0a', user_id: USER_ID, prompt: null, mixins: null, created_at: '' },
  { id: '16205bdb-6e30-439c-88f8-643f1aab6685', moment_id: '76382740-591d-431a-a27e-17707b81cc4b', user_id: USER_ID, prompt: null, mixins: null, created_at: '' },
  { id: '5b236c1a-4acd-4e28-bada-de6900b200fc', moment_id: '717e08b5-5581-4034-8a6c-3785a31e8e82', user_id: USER_ID, prompt: null, mixins: null, created_at: '' },
  { id: 'e5b39a19-fdf9-4a08-8b18-f5e0cb7c5ee3', moment_id: '6ddc0c47-8ca7-48b5-a011-557e827cc626', user_id: USER_ID, prompt: null, mixins: null, created_at: '' },
  { id: '476b9922-d2d0-4532-a2b1-ad55f911d42c', moment_id: 'c5553ab0-5465-4f98-be7d-b2b2df8dc654', user_id: USER_ID, prompt: null, mixins: null, created_at: '' },
  { id: '65ec790d-35e2-4fcd-bae7-daf76dbd7d29', moment_id: 'f8b0c1f0-6793-4972-a45f-56cb51f4307f', user_id: USER_ID, prompt: null, mixins: null, created_at: '' },
  { id: '9c63f947-c658-440c-ae7c-eda96b6199d4', moment_id: '49b4139b-441d-424a-9905-ced09acfc6a5', user_id: USER_ID, prompt: null, mixins: null, created_at: '' },
  { id: 'b79966eb-8497-41ff-9789-c43df948dafa', moment_id: '2cae8030-7cbd-436c-817f-ce1b9935313a', user_id: USER_ID, prompt: null, mixins: null, created_at: '' },
  { id: '7bbf157b-ab6d-4f7b-89cf-2a8b3e4aeeb5', moment_id: 'b6fcc6dc-3f57-46c3-8570-8d95e963853e', user_id: USER_ID, prompt: null, mixins: null, created_at: '' },
  { id: '53b1bc6f-7e1b-407d-bc05-11e309a828fc', moment_id: '2be2ca95-3e2f-4151-83b2-cdb773df06f5', user_id: USER_ID, prompt: null, mixins: null, created_at: '' },
  { id: '4822b2f4-9067-4735-b6f9-10ba4ec3cff9', moment_id: '6ddc0c47-8ca7-48b5-a011-557e827cc626', user_id: USER_ID, prompt: null, mixins: null, created_at: '' },
  { id: '5eb7c4c8-e27f-4e42-a773-0eb0050310f1', moment_id: '1985fddc-92a9-46ab-8763-cc25f0c1b0ad', user_id: USER_ID, prompt: null, mixins: null, created_at: '' },
]

export const CommunityShowcase = () => {
  return (
    <section aria-label="Community showcase" className="flex flex-col items-center gap-12 px-4">
      <div className="text-center">
        <p className="mb-3 text-xs font-semibold tracking-widest text-muted-foreground uppercase">
          Made with Kanojo Studio
        </p>
        <h2 className="text-3xl font-bold md:text-4xl">
          See what&apos;s possible.
        </h2>
      </div>

      <div className="grid w-full max-w-4xl grid-cols-3 gap-2 md:grid-cols-4">
        {SHOWCASE_PHOTOS.map(photo => (
          <div key={photo.id} className="relative aspect-9/16 overflow-hidden rounded-xl bg-muted">
            <Photo data={photo} />
          </div>
        ))}
      </div>

      <div className="flex flex-col items-center gap-4 pt-8">
        <p className="text-xl font-semibold">Ready to create yours?</p>
        <CtaButton />
      </div>
    </section>
  )
}
