import mongoose, { isValidObjectId } from "mongoose"
import Playlist from "../models/playlist.model.js"
import ApiError from "../utils/ApiError.js"
import ApiResponse from "../utils/ApiResponse.js"
import asyncHandler from "../utils/asyncHandler.js"
import User from "../models/user.model.js"

// Helper function
const checkPlaylistId = async (playlistId) => {
    if (!playlistId || playlistId === "") {
        throw new ApiError(400, "Playlist Id is required.");
    } else if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Playlist Id is not valid.");
    }

    const playlist = await Playlist.findById(playlistId).populate("video");

    if (!playlist) {
        throw new ApiError(404, "Playlist does not exist.");
    }

    return playlist;
};

const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body;

    if (!name || name === "") {
        throw new ApiError(400, "Playlist name is required.");
    } else if (!description || description === "") {
        throw new ApiError(400, "Playlist description is required.");
    }

    const existedPlaylist = await Playlist.findOne({ name });

    if (existedPlaylist) {
        throw new ApiError(409, "Playlist already exist.");
    }

    const playlist = await Playlist.create({
        name,
        description,
        owner: req.user?._id
    });

    if (!playlist) {
        throw new ApiError(500, "Playlist not created.");
    }

    return res
        .status(201)
        .json(
            new ApiResponse(200, playlist, "Playlist created successfully.")
        );
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (!userId || userId === "") {
        throw new ApiError(400, "User Id is required.");
    } else if (!isValidObjectId(userId)) {
        throw new ApiError(400, "User Id is not valid.");
    }

    const user = await User.findById(userId);

    if (!user) {
        throw new ApiError(404, "User does not exist.");
    }

    const playlists = await Playlist.find({
        owner: userId
    });

    if (!playlists || playlists.length === 0) {
        throw new ApiError(404, "No playlist exist.");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, playlists, "Playlists fetched successfully.")
        );
});

const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    //TODO: get playlist by id
    const playlist = await checkPlaylistId(playlistId);
    return res
        .status(200)
        .json(
            new ApiResponse(200, playlist, "Playlist fetched successfully.")
        );
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;

    const playlist = await checkPlaylistId(playlistId);
    if (!videoId || videoId === "") {
        throw new ApiError(400, "Video Id is required.");
    } else if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Video Id is not valid.");
    }

    const isDuplicateVideo = playlist.video.some(
        (existingVideoId) => existingVideoId.toString() === videoId
    );

    if (isDuplicateVideo) {
        throw new ApiError(400, "Video is already in the playlist.");
    }

    playlist.video.push(videoId);
    await playlist.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(
            new ApiResponse(200, playlist, "Video added successfully.")
        );
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;

    const playlist = await checkPlaylistId(playlistId);
    if (!videoId || videoId === "") {
        throw new ApiError(400, "Video Id is required.");
    } else if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Video Id is not valid.");
    }

    playlist.video = playlist.video.filter(
        (id) => id.toString() !== videoId
    );
    await playlist.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(
            new ApiResponse(200, playlist, "Video removed successfully.")
        );
})

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    // TODO: delete playlist

    await checkPlaylistId(playlistId);

    await Playlist.findByIdAndDelete(playlistId);

    return res
        .status(200)
        .json(
            new ApiResponse(200, "Playlist deleted successfully.")
        );
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    const { name, description } = req.body;

    const playlist = await checkPlaylistId(playlistId);
    if (!name || name === "") {
        throw new ApiError(400, "Playlist name is required.");
    } else if (!description || description === "") {
        throw new ApiError(400, "Playlist description is required.");
    }

    playlist.name = name;
    playlist.description = description;
    await playlist.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(
            new ApiResponse(200, playlist, "Playlist updated successfully.")
        );

})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}
