import { getFiles, getTotalSpaceUsed } from "@/lib/actions/file.action";
import { convertFileSize, getUsageSummary } from "@/lib/utils";
import Chart from "@/components/Chart";
import Link from "next/link";
import Image from "next/image";
import { Separator } from "@/components/ui/separator";
import FormatedDateTime from "@/components/FormatedDate";
import { Models } from "node-appwrite";
import Thumbnail from "@/components/Thumbnail";
import ActionDropdown from "@/components/ActionDropdown";

const Dashboard = async () => {
  const [files, totalSpace] = await Promise.all([
    getFiles({ types: [], limit: 10 }),
    getTotalSpaceUsed(),
  ]);

  const usageSummary = getUsageSummary(totalSpace);

  return (
    <div className="dashboard-container">
      <section>
        <Chart used={totalSpace.used} />

        <ul className="dashboard-summary-list">
          {usageSummary.map((summary) => (
            <Link
              href={summary.url}
              key={summary.title}
              className="dashboard-summary-card"
            >
              <div className="space-y-4">
                <div className="flex justify-between gap-3">
                  <Image
                    alt="upload Image"
                    src={summary.icon}
                    height={100}
                    width={100}
                    className="summary-type-icon"
                  />
                  <h4 className="summary-type-size">
                    {convertFileSize(summary.size) || 0}
                  </h4>
                </div>

                <h5 className="summary-type-title">{summary.title}</h5>
                <Separator />
                <FormatedDateTime
                  date={summary.latestDate}
                  className="text-center"
                />
              </div>
            </Link>
          ))}
        </ul>
      </section>
      <section className="dashboard-recent-files">
        <h2 className="h3 xl:h2 text-light-100">Recent files uploaded</h2>
        {files.documents.length > 0 ? (
          files.documents.map((file: Models.Document) => (
            <Link
              href={file.url}
              target="_blank"
              className="flex items-center gap-3 space-y-4"
              key={file.$id}
            >
              <Thumbnail
                extension={file.extension}
                type={file.type}
                url={file.url}
              />

              <div className="recent-file-details">
                <div className="flex flex-col gap-1">
                  <p className="recent-file-name">{file.name}</p>
                  <FormatedDateTime
                    date={file.$createdAt}
                    className="caption"
                  />
                </div>
                <ActionDropdown file={file} />
              </div>
            </Link>
          ))
        ) : (
          <p className="empty-list">No files uploaded</p>
        )}
      </section>
    </div>
  );
};

export default Dashboard;
